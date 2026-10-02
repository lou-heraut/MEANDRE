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

def runs(days):
    """Group consecutive days: [[first, last], ...]."""
    out = []
    for d in days:
        if out and d - out[-1][1] == timedelta(1):
            out[-1][1] = d
        else:
            out.append([d, d])
    return out

def spans(days):
    """'2026-03-04 → 2026-03-06 (3 j), 2026-03-09'"""
    return ", ".join(str(a) if a == b else "%s → %s (%d j)" % (a, b, (b - a).days + 1)
                     for a, b in runs(days)) or "aucun"


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
MONTH_NAMES = ["jan", "fév", "mar", "avr", "mai", "jun",
               "jul", "aoû", "sep", "oct", "nov", "déc"]
fmt = lambda x: "—" if x is None else "%.1f" % x

def mean(values):
    values = list(values)
    return sum(values) / len(values) if values else None

def monthly(rows):
    """Number of days, mean users and mean ips per month."""
    months = defaultdict(list)
    for d, r in rows.items():
        months[date(d.year, d.month, 1)].append(r)
    return {m: {"days": len(v), "users": mean(r["users"] for r in v),
                "ips": mean(r["ips"] for r in v)}
            for m, v in sorted(months.items())}

def summary(rows, full):
    """Last 30 finished days, compared with the 30 days before."""
    last = max(full)
    recent = [(d, full[d]) for d in (last - timedelta(i) for i in range(30)) if d in full]
    before = mean(full[d]["users"] for d in (last - timedelta(i) for i in range(30, 60))
                  if d in full)
    users = mean(r["users"] for _, r in recent)
    return {"users": users, "ips": mean(r["ips"] for _, r in recent),
            "week": mean(r["users"] for d, r in recent if d.weekday() < 5),
            "weekend": mean(r["users"] for d, r in recent if d.weekday() >= 5),
            "trend": "%+.0f\u00a0%%" % (100 * (users / before - 1)) if before else "—",
            "missing": missing(rows)}

def print_chart(grid, vmax, axis):
    """Rows of a chart, y labels at the top and at half height, then the x axis."""
    labels = {0: vmax, len(grid) // 2: vmax / 2}
    for i, cells in enumerate(grid):
        label = "%5.0f ┤" % labels[i] if i in labels else "      │"
        print(label + "".join(cells).rstrip())
    print("    0 └" + axis)

def ascii_monthly(months, height=12, step=7):
    """Monthly means per day of the last 13 months: o users, x ips, dotted lines."""
    months = dict(list(months.items())[-13:])
    vmax = max(v["ips"] for v in months.values()) or 1
    grid = [[" "] * (step * (len(months) - 1) + 1) for _ in range(height)]

    def plot(col, value, char):
        grid[height - 1 - min(height - 1, int(value / vmax * height))][col] = char

    for key in ("ips", "users"):  # dotted lines first, markers on top
        values = [v[key] for v in months.values()]
        for i, (y0, y1) in enumerate(zip(values, values[1:])):
            for c in range(1, step):
                plot(i * step + c, y0 + (y1 - y0) * c / step, "·")
    for key, marker in (("ips", "x"), ("users", "o")):
        for i, v in enumerate(months.values()):
            plot(i * step, v[key], marker)
    print_chart(grid, vmax, "─" * len(grid[0]))
    print(" " * 7 + "".join(MONTH_NAMES[m.month - 1].ljust(step) for m in months).rstrip())
    print(" " * 7 + "".join((str(m.year) if m.month == 1 or i == 0 else "").ljust(step)
                            for i, m in enumerate(months)).rstrip())

def ascii_daily(full, missing_days, height=8, ndays=90):
    """Users per day of the last 90 finished days, one column per day."""
    days = [max(full) - timedelta(i) for i in range(ndays - 1, -1, -1)]
    vmax = max([full[d]["users"] for d in days if d in full] + [1])
    columns = []
    for d in days:
        if d in missing_days:
            column = "░" * height
        elif d not in full:
            column = ""
        elif d.weekday() >= 5:
            column = "▒" * round(full[d]["users"] / vmax * height)
        else:  # to the nearest 1/8 of a row
            n = round(full[d]["users"] / vmax * height * 8)
            column = "█" * (n // 8) + " ▁▂▃▄▅▆▇"[n % 8].strip()
        columns.append(column.ljust(height))
    grid = [[c[height - 1 - i] for c in columns] for i in range(height)]
    print_chart(grid, vmax, "".join("┬" if d.day == 1 else "─" for d in days))
    ticks = [i for i, d in enumerate(days) if d.day == 1]
    names = [" "] * ndays
    for i in ([0] if not ticks or ticks[0] > 3 else []) + ticks:
        if i + 3 <= ndays:  # a name only if it fits entirely
            names[i:i + 3] = MONTH_NAMES[days[i].month - 1]
    print(" " * 7 + "".join(names).rstrip())

def ascii_report(args):
    """Terminal report, 100 columns max: summary and the two charts of the HTML report."""
    for app in APPS:
        path = csv_path(args, app)
        rows = read_csv(path)
        print("\n━━ %s %s" % (app, "━" * (96 - len(app))))
        full = finished(path, rows) if rows else {}
        if not full:
            print("  aucun jour complet : lancer d'abord update")
            continue
        s = summary(rows, full)
        print("\n  %s → %s · %d jours de logs · %d jours d'arrêt"
              % (min(rows), max(rows), len(rows), len(s["missing"])))
        print("  users/jour sur 30 jours : %s (semaine %s, week-end %s), %s vs les 30 jours d'avant"
              % (fmt(s["users"]), fmt(s["week"]), fmt(s["weekend"]), s["trend"]))
        print("  ips/jour sur 30 jours   : %s" % fmt(s["ips"]))
        for d in sorted(set(rows) - set(full)):
            print("  %-23s : %d users, %d ips"
                  % ("%s (partiel)" % d, rows[d]["users"], rows[d]["ips"]))
        print(textwrap.fill("arrêts : " + spans(s["missing"]), 98, initial_indent="  ",
                            subsequent_indent="    ", break_on_hyphens=False))
        print("\n  moyennes mensuelles par jour (o users, x ips)\n")
        ascii_monthly(monthly(full))
        print("\n  users par jour (█ semaine, ▒ week-end, ░ arrêt)\n")
        ascii_daily(full, set(s["missing"]))

PAGE = """<!doctype html><html lang="fr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Statistiques d'accès</title>
<style>body{font-family:system-ui,sans-serif;max-width:1000px;margin:2em auto;padding:0 16px;
color:#222;background:#fff}h2{margin-top:2em}p{color:#555}
hr{border:0;border-top:1px solid #d5d9e0;margin:3em 0 0}
.tiles{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px}
.tile{background:#f4f6f9;border-radius:8px;padding:12px 16px}
.tile b{display:block;font-size:1.6em;font-weight:600}.tile span{color:#555;font-size:.9em}
</style></head><body><h1>Statistiques d'accès</h1>
<p>Généré le %s. <b>users</b> : IP distinctes ayant appelé l'API de la carte, bon proxy
d'utilisateur humain. <b>ips</b> : toutes les IP distinctes, robots compris. Le jour en
cours, partiel, est exclu ; les bandes grises marquent les jours d'arrêt du serveur.</p>
%s</body></html>
"""
TILE = '<div class="tile"><b>%s</b><span>%s</span></div>'

def html_report(args):
    """Local HTML report (plotly is only needed here)."""
    import plotly.graph_objects as go
    blue, light_blue, dark_blue = "#2a78d6", "#9ec5f0", "#1b4f8a"
    orange, grey = "#f28e2b", "#b4aca2"
    body, js = [], "cdn"
    for app in APPS:
        path = csv_path(args, app)
        rows = read_csv(path)
        full = finished(path, rows) if rows else {}
        if not full:
            continue
        s, months, days = summary(rows, full), monthly(full), sorted(full)
        tiles = [(fmt(s["users"]), "users par jour sur 30 jours, %s vs les 30 jours d'avant"
                  % s["trend"]),
                 ("%s / %s" % (fmt(s["week"]), fmt(s["weekend"])),
                  "users par jour en semaine / le week-end"),
                 (fmt(s["ips"]), "ips par jour sur 30 jours"),
                 (len(s["missing"]), "jours d'arrêt sur %d jours de logs" % len(rows))]
        if body:  # a line between apps
            body.append("<hr>")
        body.append("<h2>%s</h2><div class=tiles>%s</div>"
                    % (app, "".join(TILE % t for t in tiles)))

        by_month = go.Figure([
            go.Scatter(x=list(months), y=[v["ips"] for v in months.values()],
                       line_color=orange,
                       name="ips : toutes les IP, robots compris",
                       hovertemplate="%{y:.1f} ips<extra></extra>"),
            go.Scatter(x=list(months), y=[v["users"] for v in months.values()],
                       line_color=blue,
                       name="users : IP ayant utilisé la carte",
                       customdata=[v["days"] for v in months.values()],
                       hovertemplate="%{y:.1f} users (%{customdata} jours)<extra></extra>")])
        by_month.update_layout(title="Moyenne mensuelle par jour",
                               xaxis=dict(tickformat="%m/%Y", hoverformat="%m/%Y"))

        # centred mean over 7 days, smooths out the weekends
        rolling = [mean(full[d + timedelta(k)]["users"] for k in range(-3, 4)
                        if d + timedelta(k) in full) for d in days]
        bars = [go.Bar(x=[d for d in days if (d.weekday() >= 5) == weekend],
                       y=[full[d]["users"] for d in days if (d.weekday() >= 5) == weekend],
                       name=name, marker_color=color,
                       hovertemplate="%{y} users<extra></extra>")
                for weekend, name, color in ((False, "semaine", blue),
                                             (True, "week-end", light_blue))]
        by_day = go.Figure(bars + [go.Scatter(
            x=days, y=rolling, mode="lines", line=dict(color=dark_blue, width=1.5),
            name="moyenne sur 7 jours",
            hovertemplate="%{y:.1f} en moyenne sur 7 jours<extra></extra>")])
        periods = [dict(count=3, label="3 mois", step="month", stepmode="backward"),
                   dict(count=6, label="6 mois", step="month", stepmode="backward"),
                   dict(step="all", label="tout")]
        by_day.update_layout(title="Users par jour", barmode="overlay", bargap=0.1,
                             xaxis=dict(tickformat="%m/%Y", hoverformat="%d/%m/%Y",
                                        rangeselector=dict(buttons=periods)))

        for fig in (by_month, by_day):
            for start, end in runs(s["missing"]):
                fig.add_vrect(x0="%s 12:00" % (start - timedelta(1)), x1="%s 12:00" % end,
                              fillcolor=grey, opacity=0.25, line_width=0, layer="below")
            if s["missing"]:  # legend entry of the grey bands
                fig.add_trace(go.Scatter(x=[None], y=[None], mode="markers",
                                         name="arrêt du serveur", marker=dict(
                                             symbol="square", size=12, color=grey, opacity=0.5)))
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
