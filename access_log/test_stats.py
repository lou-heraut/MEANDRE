#!/usr/bin/env python3

# Copyright 2026
# Louis Héraut (louis.heraut@inrae.fr)*1

# *1   INRAE, France

# This file is part of MEANDRE.

# MEANDRE is free software: you can redistribute it and/or modify it
# under the terms of the GNU Affero General Public License as
# published by the Free Software Foundation, either version 3 of the
# License, or (at your option) any later version.

# MEANDRE is distributed in the hope that it will be useful, but
# WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
# Affero General Public License for more details.

# You should have received a copy of the GNU Affero General Public
# License along with MEANDRE.
# If not, see <https://www.gnu.org/licenses/>.


"""Tests of stats.py on synthetic logs (IPs from 192.0.2.0/24).

Run with: make stats-test
"""

import contextlib
import gzip
import io
import os
import tempfile
import unittest
from datetime import date, datetime, timedelta

import stats

T = date.today()
D = {i: T - timedelta(i) for i in range(1, 31)}
HUMAN = "Mozilla/5.0 (X11; Linux x86_64; rv:130.0) Gecko/20100101 Firefox/130.0"


def line(ip, day, request, agent=HUMAN, hour="12:00:00"):
    return '%s - - [%s:%s +0200] "%s" 200 512 "-" "%s"\n' % (
        ip, stats.log_day(day), hour, request, agent)


# Rotation just after midnight: the .1 file ends with a line of today
MEANDRE = {
    "MEANDRE_access.log": [
        line("192.0.2.1", T, "POST /get_delta_serie HTTP/1.1", hour="09:00:00"),
        line("192.0.2.11", T, "GET / HTTP/1.1", hour="09:05:00")],
    "MEANDRE_access.log.1": [
        line("192.0.2.1", D[1], "GET / HTTP/1.1"),
        line("192.0.2.1", D[1], "POST /get_delta_on_horizon HTTP/1.1"),
        line("192.0.2.1", D[1], "POST /get_delta_serie HTTP/1.1"),
        line("192.0.2.2", D[1], "POST /get_delta_serie?code=K001 HTTP/1.1"),
        line("192.0.2.3", D[1], "GET /robots.txt HTTP/1.1",
             "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"),
        line("192.0.2.4", D[1], "POST /cgi-bin/luci/;stok=/locale HTTP/1.1",
             "python-requests/2.31"),
        line("192.0.2.5", D[1], "POST /index.php?s=/get_delta_serie HTTP/1.1",
             "curl/8.5.0"),
        line("192.0.2.6", D[1], "GET /get_delta_serie HTTP/1.1"),
        line("192.0.2.7", D[1], "POST /get_delta_series HTTP/1.1"),
        line("192.0.2.8", D[1], "POST /get_narrative HTTP/1.1"),
        line("192.0.2.9", D[1], 'GET /\\"evil\\" HTTP/1.1'),
        "not an apache line\n",
        line("192.0.2.10", T, "GET / HTTP/1.1", hour="00:00:10")],
    "MEANDRE_access.log.2.gz": [
        line("192.0.2.1", D[2], "POST /get_delta_serie HTTP/1.1"),
        line("192.0.2.12", D[2], "GET / HTTP/1.1", "Mozilla/5.0 HeadlessChrome/120.0")],
    # D[3] missing
    "MEANDRE_access.log.3.gz": [line("192.0.2.1", D[4], "GET / HTTP/1.1")],
    "MEANDRE_access.log.4.gz": [line("192.0.2.1", D[5], "GET / HTTP/1.1"),
                                line("192.0.2.2", D[5], "GET / HTTP/1.1")],
}
TRACC = {
    "MEANDRE-TRACC_access.log": [
        line("192.0.2.20", D[1], "POST /get_narrative_data HTTP/1.1"),
        line("192.0.2.21", D[1], "POST /get_narrative HTTP/1.1"),
        line("192.0.2.22", D[1], "POST /define_data_palette?x=1 HTTP/2.0"),
        line("192.0.2.23", D[1], "POST /get_delta_serie HTTP/1.1"),
        line("192.0.2.24", D[1], "POST /get_narrative/../x HTTP/1.1",
             "Go-http-client/1.1"),
        line("192.0.2.25", D[1], "GET /get_narrative_data HTTP/1.1",
             "facebookexternalhit/1.1")],
}
# Pre-existing CSV: D[30] left the rotation, D[5] is the oldest (truncated)
# day of the logs, D[1] holds stale values
OLD_CSV = ("date,requests,ips,users,bot_requests\n"
           "%s,100,50,20,10\n%s,50,20,5,10\n%s,1,1,1,1\n" % (D[30], D[5], D[1]))


def row(requests, ips, users, bot_requests):
    return dict(zip(stats.FIELDS, (requests, ips, users, bot_requests)))


class TestStats(unittest.TestCase):

    def setUp(self):
        tmp = tempfile.TemporaryDirectory()
        self.addCleanup(tmp.cleanup)
        self.logs = os.path.join(tmp.name, "logs")
        self.out = os.path.join(tmp.name, "stats")
        os.makedirs(self.logs)
        os.makedirs(self.out)
        for name, lines in {**MEANDRE, **TRACC}.items():
            opener = gzip.open if name.endswith(".gz") else open
            with opener(os.path.join(self.logs, name), "wt") as f:
                f.writelines(lines)
        with open(os.path.join(self.out, "MEANDRE_daily.csv"), "w") as f:
            f.write(OLD_CSV)

    def run_stats(self, command):
        out = io.StringIO()
        with contextlib.redirect_stdout(out):
            stats.main([command, "--log-dir", self.logs, "--stats-dir", self.out])
        return out.getvalue()

    def csv(self, app):
        return stats.read_csv(os.path.join(self.out, app + "_daily.csv"))

    def test_parse(self):
        paths = stats.log_files(self.logs, "MEANDRE_access.log")
        self.assertEqual(len(paths), 5)
        days, malformed = stats.parse(paths, stats.APPS["MEANDRE"]["api"])
        self.assertEqual(malformed, 1)
        self.assertEqual(days[D[1]], row(11, 9, 2, 3))
        self.assertEqual(days[T], row(3, 3, 1, 0))
        self.assertEqual(days[D[2]], row(2, 2, 1, 1))
        self.assertNotIn(D[3], days)

    def test_update(self):
        output = self.run_stats("update")
        rows = self.csv("MEANDRE")
        self.assertEqual(rows[D[30]], row(100, 50, 20, 10))   # kept
        self.assertEqual(rows[D[5]], row(50, 20, 5, 10))      # truncated, kept
        self.assertEqual(rows[D[1]], row(11, 9, 2, 3))        # overwritten
        self.assertEqual(rows[D[4]], row(1, 1, 0, 0))
        self.assertEqual(rows[T], row(3, 3, 1, 0))
        self.assertEqual(stats.missing(rows),
                         [D[i] for i in range(29, 5, -1)] + [D[3]])
        self.assertEqual(self.csv("MEANDRE-TRACC"), {D[1]: row(6, 6, 3, 2)})
        self.assertIn("1 lignes mal formées", output)
        self.assertIn("%s → %s (24 j), %s" % (D[29], D[6], D[3]), output)
        with open(os.path.join(self.out, "MEANDRE_daily.csv")) as f:
            self.assertEqual(f.readline(), "date,requests,ips,users,bot_requests\n")
        # Idempotent
        before = self.csv("MEANDRE")
        self.run_stats("update")
        self.assertEqual(self.csv("MEANDRE"), before)

    def test_oldest_day_overwritten_when_more_complete(self):
        with open(os.path.join(self.out, "MEANDRE_daily.csv"), "w") as f:
            f.write("date,requests,ips,users,bot_requests\n%s,1,1,0,0\n" % D[5])
        self.run_stats("update")
        self.assertEqual(self.csv("MEANDRE")[D[5]], row(2, 2, 0, 0))

    def test_partial_day_from_last_update(self):
        self.run_stats("update")
        path = os.path.join(self.out, "MEANDRE_daily.csv")
        rows = stats.read_csv(path)
        self.assertEqual(max(stats.finished(path, rows)), D[1])
        # CSV updated yesterday, read today: its last day is still partial
        yesterday = (datetime.now() - timedelta(1)).timestamp()
        os.utime(path, (yesterday, yesterday))
        self.assertEqual(max(stats.finished(path, rows)), D[2])

    def test_no_ip_written(self):
        self.run_stats("update")
        self.run_stats("ascii")
        for name in os.listdir(self.out):
            with open(os.path.join(self.out, name)) as f:
                self.assertNotIn("192.0.2.", f.read())

    def test_ascii(self):
        self.run_stats("update")
        output = self.run_stats("ascii")
        self.assertTrue(all(len(l) <= 100 for l in output.splitlines()))
        self.assertIn("25 jours d'arrêt", output)
        self.assertIn("%s (partiel)" % T, output)
        self.assertIn("arrêts : %s → %s (24 j), %s" % (D[29], D[6], D[3]), output)
        self.assertIn("(o users, x ips)", output)
        self.assertIn("░", output.split("(█ semaine, ▒ week-end, ░ arrêt)")[1])

    def test_today(self):
        output = self.run_stats("today")
        lines = {l.split()[0]: l.split()[1:] for l in output.splitlines()[2:]}
        # current file only: the 00:00:10 line of the .1 file is not read
        self.assertEqual(lines["MEANDRE"], ["1", "2", "2", "0"])
        self.assertEqual(lines["MEANDRE-TRACC"], ["0", "0", "0", "0"])

    def test_html(self):
        try:
            import plotly  # noqa: F401
        except ImportError:
            self.skipTest("plotly absent")
        self.run_stats("update")
        self.run_stats("html")
        with open(os.path.join(self.out, "report.html")) as f:
            html = f.read()
        self.assertIn("cdn.plot.ly", html)
        self.assertNotIn("192.0.2.", html)


if __name__ == "__main__":
    unittest.main()
