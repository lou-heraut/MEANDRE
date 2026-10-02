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


"""Statistiques d'accès de MEANDRE et MEANDRE-TRACC (logs Apache).

  update  [prod, root]  met à jour stats/<app>_daily.csv depuis tous les logs
  ascii   [prod/local]  rapport terminal à partir des CSV
  today   [prod, root]  chiffres du jour en cours (fichier de log courant)
  html    [local]       stats/report.html avec plotly

Les IP ne vivent qu'en mémoire : seuls des comptes journaliers sont écrits.
"""

import argparse
import csv
import gzip
import os
import re
import textwrap
from collections import defaultdict
from datetime import date, datetime, timedelta


## CONFIG ____________________________________________________________
LOG_DIR = "/var/log/apache2"
STATS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "stats")
# "api": exact path of the POST routes called by the page JS,
# optionally followed by a query string
APPS = {
    "MEANDRE": {
        "log": "MEANDRE_access.log",
        "api": r"/(get_delta_on_horizon|get_delta_serie)(\?.*)?",
    },
    "MEANDRE-TRACC": {
        "log": "MEANDRE-TRACC_access.log",
        "api": r"/(get_narrative_data|get_narrative|define_data_palette)(\?.*)?",
    },
}
BOTS = r"bot|crawl|spider|slurp|curl|python|wget|go-http|headless|externalhit"


## PARSING ___________________________________________________________
MONTHS = "Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split()
QUOTED = r'"((?:[^"\\]|\\.)*)"'
# Apache combined: %h %l %u %t "%r" %>s %O "%{Referer}i" "%{User-Agent}i"
LINE = re.compile(r'(\S+) \S+ \S+ \[(\d{2}/(?:%s)/\d{4}):[^\]]+\] %s \d{3} \S+ %s %s'
                  % ("|".join(MONTHS), QUOTED, QUOTED, QUOTED))
FIELDS = ["requests", "ips", "users", "bot_requests"]

def log_day(d):
    """date(2026, 6, 25) -> '25/Jun/2026'"""
    return "%02d/%s/%d" % (d.day, MONTHS[d.month - 1], d.year)

def to_date(day):
    """'25/Jun/2026' -> date(2026, 6, 25)"""
    d, m, y = day.split("/")
    return date(int(y), MONTHS.index(m) + 1, int(d))

def log_files(log_dir, name):
    """Current file, .N and .N.gz of an app."""
    pattern = re.compile(re.escape(name) + r"(\.\d+)?(\.gz)?")
    return sorted(os.path.join(log_dir, f) for f in os.listdir(log_dir)
                  if pattern.fullmatch(f))

def parse(paths, api, only_day=None):
    """Daily counts, the date being read from the timestamp of each line."""
    api, bots = re.compile(api), re.compile(BOTS, re.IGNORECASE)
    days = defaultdict(lambda: [0, set(), set(), 0])
    malformed = 0
    for path in paths:
        opener = gzip.open if path.endswith(".gz") else open
        with opener(path, "rt", encoding="utf-8", errors="replace") as f:
            for line in f:
                m = LINE.match(line)
                if not m:
                    malformed += 1
                    continue
                ip, day, request, _, agent = m.groups()
                if only_day and day != only_day:
                    continue
                d = days[day]
                d[0] += 1
                d[1].add(ip)
                method, _, target = request.partition(" ")
                if method == "POST" and api.fullmatch(target.split(" ")[0]):
                    d[2].add(ip)
                if bots.search(agent):
                    d[3] += 1
    # IP sets are dropped here, only their sizes are kept
    return {to_date(k): dict(zip(FIELDS, (v[0], len(v[1]), len(v[2]), v[3])))
            for k, v in days.items()}, malformed


## CSV _______________________________________________________________
def csv_path(args, app):
    return os.path.join(args.stats_dir, app + "_daily.csv")

def read_csv(path):
    if not os.path.exists(path):
        return {}
    with open(path, newline="") as f:
        return {date.fromisoformat(r["date"]): {k: int(r[k]) for k in FIELDS}
                for r in csv.DictReader(f)}

def write_csv(path, rows):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path + ".tmp", "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["date"] + FIELDS)
        w.writerows([d.isoformat()] + [rows[d][k] for k in FIELDS] for d in sorted(rows))
    os.replace(path + ".tmp", path)

def finished(path, rows):
    """Days finished at the last update, i.e. the CSV modification time.

    The last day written by update is usually the partial current day."""
    updated = date.fromtimestamp(os.path.getmtime(path))
    return {d: r for d, r in rows.items() if d < updated}

def missing(rows):
    """Days absent between the first and the last known day."""
    if not rows:
        return []
    days = (min(rows) + timedelta(i) for i in range((max(rows) - min(rows)).days))
    return [d for d in days if d not in rows]

def spans(days):
    """Group consecutive days: '2026-03-04 → 2026-03-06 (3 j)'."""
    out = []
    for d in days:
        if out and d - out[-1][1] == timedelta(1):
            out[-1][1] = d
        else:
            out.append([d, d])
    return ", ".join(str(a) if a == b else "%s → %s (%d j)" % (a, b, (b - a).days + 1)
                     for a, b in out) or "aucun"


## UPDATE AND TODAY __________________________________________________
def update(args):
    """Recompute the days present in the logs and merge them into the CSV."""
    print(datetime.now().strftime("update %Y-%m-%d %H:%M"))
    for app, conf in APPS.items():
        paths = log_files(args.log_dir, conf["log"])
        if not paths:
            print("%s : aucun fichier %s* dans %s" % (app, conf["log"], args.log_dir))
            continue
        new, malformed = parse(paths, conf["api"])
        path = csv_path(args, app)
        rows = read_csv(path)
        # The beginning of the oldest day may have left the rotation:
        # keep the CSV value if it saw more requests
        first = min(new, default=None)
        if first in rows and rows[first]["requests"] > new[first]["requests"]:
            del new[first]
        kept = len(set(rows) - set(new))
        rows.update(new)
        write_csv(path, rows)
        print("%s : %d fichiers, %d lignes mal formées\n"
              "  %d jours recalculés%s, %d conservés du CSV" % (
                  app, len(paths), malformed, len(new),
                  " (%s → %s)" % (min(new), max(new)) if new else "", kept))
        print("  jours manquants : " + spans(missing(rows)))

def today(args):
    """Figures of the current day, from the current log file only."""
    now = datetime.now()
    print(now.strftime("%Y-%m-%d %H:%M:%S  jour en cours (partiel)\n"))
    print("  %-15s %7s %7s %9s %13s" % ("", "users", "ips", "requests", "bot_requests"))
    for app, conf in APPS.items():
        path = os.path.join(args.log_dir, conf["log"])
        if not os.path.exists(path):
            print("  %-15s fichier %s absent" % (app, path))
            continue
        rows, _ = parse([path], conf["api"], log_day(now))
        r = rows.get(now.date(), dict.fromkeys(FIELDS, 0))
        print("  %-15s %7d %7d %9d %13d" % (app, r["users"], r["ips"],
                                           r["requests"], r["bot_requests"]))


## REPORTS ___________________________________________________________
WEEKDAYS = ["lun", "mar", "mer", "jeu", "ven", "sam", "dim"]

def mean(values):
    values = list(values)
    return sum(values) / len(values) if values else None

def monthly(rows):
    """Monthly averages of daily values."""
    months = defaultdict(dict)
    for d, r in rows.items():
        months[d.strftime("%Y-%m")][d] = r
    return {m: {"days": len(v), "users_total": sum(r["users"] for r in v.values()),
                "users": mean(r["users"] for r in v.values()),
                "ips": mean(r["ips"] for r in v.values()),
                "users_week": mean(r["users"] for d, r in v.items() if d.weekday() < 5),
                "users_weekend": mean(r["users"] for d, r in v.items() if d.weekday() >= 5)}
            for m, v in sorted(months.items())}

def ascii_report(args):
    """Terminal report, 100 columns max."""
    fmt = lambda x: "—" if x is None else "%.1f" % x
    for app in APPS:
        rows = read_csv(csv_path(args, app))
        print("\n━━ %s %s" % (app, "━" * (96 - len(app))))
        if not rows:
            print("  aucune donnée : lancer d'abord update")
            continue
        full = finished(csv_path(args, app), rows)

        print("\n  30 derniers jours (█ semaine, ░ week-end)\n")
        print("  %-10s  %-4s %6s %6s %13s" % ("date", "jour", "users", "ips", "bot_requests"))
        days = [max(rows) - timedelta(i) for i in range(29, -1, -1)]
        vmax = max([rows[d]["users"] for d in days if d in rows] + [1])
        for d in days:
            if d.weekday() == 0 and d != days[0]:
                print()
            line, r = "  %s  %-4s" % (d, WEEKDAYS[d.weekday()]), rows.get(d)
            if r is None:
                print(line + "  manquant")
                continue
            block = "░" if d.weekday() >= 5 else "█"
            print(line + " %6d %6d %13d  %s%s" % (
                r["users"], r["ips"], r["bot_requests"], block * round(r["users"] / vmax * 30),
                "" if d in full else "  partiel"))
        if not full:
            continue

        months = monthly(full)
        print("\n  par mois (moyennes par jour, jour partiel exclu)\n")
        print("  %-7s %5s %15s %15s %8s %12s" % (
            "mois", "jours", "users semaine", "users week-end", "ips", "total users"))
        for m, v in months.items():
            print("  %-7s %5d %15s %15s %8s %12d" % (
                m, v["days"], fmt(v["users_week"]), fmt(v["users_weekend"]),
                fmt(v["ips"]), v["users_total"]))

        print("\n  moyenne mensuelle des users par jour\n")
        vmax = max(v["users"] for v in months.values()) or 1
        for m, v in months.items():
            print("  %-7s %s %s" % (m, "█" * round(v["users"] / vmax * 70), fmt(v["users"])))

        days = [max(full) - timedelta(i) for i in range(89, -1, -1)]
        values = [full[d]["users"] if d in full else None for d in days]
        vmax = max([v for v in values if v is not None] + [1])
        print("\n  users par jour sur 90 jours (%s → %s, max %d)\n" % (days[0], days[-1], vmax))
        print("  " + "".join(" " if v is None else "▁▂▃▄▅▆▇█"[round(v / vmax * 7)]
                             for v in values))

        print("\n" + textwrap.fill("jours manquants : " + spans(missing(rows)), 98,
                                   initial_indent="  ", subsequent_indent="    ",
                                   break_on_hyphens=False))

PAGE = """<!doctype html><html lang="fr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Statistiques d'accès</title>
<style>body{font-family:system-ui,sans-serif;max-width:1000px;margin:2em auto;padding:0 16px;
color:#222;background:#fff}h2{margin-top:2em}</style></head><body><h1>Statistiques d'accès</h1>
<p>Généré le %s. <b>users</b> : IP distinctes ayant appelé l'API de la carte, bon proxy
d'utilisateur humain. <b>ips</b> : toutes les IP distinctes, robots compris.
Le jour partiel en cours est exclu.</p>
%s</body></html>
"""

def html_report(args):
    """Local HTML report (plotly is only needed here)."""
    import plotly.graph_objects as go
    blue, light_blue, orange = "#2a78d6", "#9ec5f0", "#eb6834"
    body, js = [], "cdn"
    for app in APPS:
        path = csv_path(args, app)
        rows = finished(path, read_csv(path))
        if not rows:
            continue
        months = monthly(rows)
        x = [m + "-01" for m in months]
        by_month = go.Figure([
            go.Scatter(x=x, y=[v["users"] for v in months.values()], line_color=blue,
                       name="users : IP ayant utilisé la carte"),
            go.Scatter(x=x, y=[v["ips"] for v in months.values()], line_color=orange,
                       name="ips : toutes les IP, robots compris")])
        by_month.update_layout(title="Moyenne mensuelle par jour", xaxis_tickformat="%m/%Y")
        days = sorted(rows)
        by_day = go.Figure([
            go.Bar(x=[d for d in days if (d.weekday() >= 5) == weekend],
                   y=[rows[d]["users"] for d in days if (d.weekday() >= 5) == weekend],
                   name=name, marker_color=color)
            for weekend, name, color in ((False, "semaine", blue),
                                         (True, "week-end", light_blue))])
        by_day.update_layout(title="Users par jour", barmode="overlay", bargap=0.1)
        body.append("<h2>%s</h2>" % app)
        for fig in (by_month, by_day):
            fig.update_layout(template="plotly_white", height=380, hovermode="x unified",
                              yaxis_rangemode="tozero", legend_orientation="h",
                              margin=dict(l=40, r=20, t=60, b=30))
            body.append(fig.to_html(full_html=False, include_plotlyjs=js,
                                    config={"displayModeBar": False}))
            js = False
    path = os.path.join(args.stats_dir, "report.html")
    with open(path, "w", encoding="utf-8") as f:
        f.write(PAGE % (date.today(), "\n".join(body)))
    print(path)


## MAIN ______________________________________________________________
COMMANDS = {"update": update, "ascii": ascii_report, "today": today, "html": html_report}

def main(argv=None):
    parser = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("command", choices=COMMANDS)
    parser.add_argument("--log-dir", default=LOG_DIR, help="dossier des logs Apache")
    parser.add_argument("--stats-dir", default=STATS_DIR, help="dossier des CSV")
    args = parser.parse_args(argv)
    COMMANDS[args.command](args)

if __name__ == "__main__":
    main()
