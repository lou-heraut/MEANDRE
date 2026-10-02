# MEANDRE

Guided web presentation of the Explore2 hydrological projections for France.
A Flask app serves the page and a small JSON API read by the frontend JS; the
data is a PostgreSQL database; production runs under Apache with mod_wsgi.
MEANDRE-TRACC is a sibling app (separate repository) hosted on the same server,
with the same structure and the same Makefile skeleton.

The maintainer works in French: answer in French. Code comments, docstrings
and commit messages are in English; output meant for the user (reports, make
help) is in French.

## Layout
- `app.py`: Flask routes. The page routes all render `templates/index.html`;
  the API routes are `POST /get_delta_on_horizon` (map) and
  `POST /get_delta_serie` (chart).
- `app.wsgi`: mod_wsgi entry point, finds the app and its `.env` next to itself.
- `static/`: frontend (`js/`, `css/`, `html/` fragments), `py/color.py` used by
  `app.py`, `R/` legacy scripts.
- `access_log/stats.py`: access statistics from the Apache logs, for MEANDRE and
  MEANDRE-TRACC; `access_log/test_stats.py` tests it on synthetic logs.
- `check_api.py`: queries the two API routes on the real database without Apache
  and prints a fingerprint of the responses.
- `Makefile`: the single entry point, `make help` lists the targets.
- `INSTALL.md`: server installation, as an ordered list of make targets.

## Commands
- Local: `make venv-dev` (venv `.python_env` with plotly), `make run`
  (http://127.0.0.1:5000), `make test`, `make stats-get` then `make stats-html`.
- Server, from the code directory: `make update` (git pull --ff-only, pip
  install, `touch app.wsgi` to reload the mod_wsgi daemon), `make status`,
  `make check`, `make logs`, `make stats`, `make stats-live`.

## Conventions
- Everything runs from the code directory: no hardcoded paths (Makefile uses
  `$(CURDIR)`, `app.wsgi` its own directory). The server is a plain git checkout,
  never edited by hand: changes go through a commit and `make update`.
- Production is detected in `static/js/script.js` from the hostname, so the
  deployed code is exactly the repository.
- Python dependencies are pinned in `requirements.txt` to the latest versions
  supporting the server's Python, and installed in `.python_env` locally and on
  the server; plotly is local only (`requirements-dev.txt`).
- `.env` is a dotenv file (see `.env.example`): the Makefile reads its values
  with sed (`dotenv` function), it must never be sourced by a shell.
- Before changing the Python environment of the server, compare
  `make check PYTHON=<current python>` with `make check`: same fingerprints,
  same data served.
- New files take the AGPL header of `access_log/stats.py`.

## Access statistics (`access_log/stats.py`)
- Standard library only for `update`, `ascii` and `today` (run by cron with the
  system python3); plotly is imported in `html` only.
- IP addresses only live in memory: the CSV `access_log/stats/<app>_daily.csv`
  (app name in lowercase, e.g. `meandre-tracc_daily.csv`)
  holds `date,requests,ips,users,bot_requests` and nothing else.
- `users` (distinct IPs calling the API routes) is the main metric, `ips` counts
  robots too. Dates come from each line's timestamp, never from the rotation.
- `update` recomputes the days present in the logs and keeps older days from the
  CSV; the oldest log day keeps its CSV value if it saw more requests (its start
  may have left the rotation). The day of the last update (CSV mtime) is
  partial and excluded from the averages.
- The terminal report (100 columns max) and the HTML report show the same
  content: summary, monthly means users vs ips, users per day, server stops.

## Pitfalls
- GNU make runs a recipe line containing `$(MAKE)` even under `make -n`, and
  with `.ONESHELL` the whole recipe is one line: never call `$(MAKE)` inside a
  recipe, share code with `define` blocks instead.
- `app.py` is the production API: keep its changes minimal and verify them
  with `make check`.
