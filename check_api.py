
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


"""Vérifie l'API de la carte sur la vraie base, sans passer par Apache.

Interroge les deux routes comme le fait la page (mode narratif, QA, H3)
et affiche une empreinte des réponses : deux environnements Python qui
donnent les mêmes empreintes servent exactement les mêmes données.
"""

import hashlib
import json
import sys

from app import app

HM = ["CTRIP", "EROS", "GRSD", "J2000", "MORDOR-SD",
      "MORDOR-TS", "ORCHIDEE", "SIM2", "SMASH"]
QUERY = {"exp": "historical_rcp85", "variable": "QA",
         "chain": ["historical-rcp85_HadGEM2-ES_ALADIN63_ADAMONT_" + hm for hm in HM]}


def fingerprint(data):
    """Hash of a response, floats rounded to absorb numerical noise."""
    def rounded(x):
        if isinstance(x, float):
            return float("%.6g" % x)
        if isinstance(x, list):
            return [rounded(v) for v in x]
        if isinstance(x, dict):
            return {k: rounded(v) for k, v in x.items()}
        return x
    return hashlib.sha256(json.dumps(rounded(data), sort_keys=True).encode()).hexdigest()[:12]


def post(route, query):
    """Response of a route, or stop with its error (traceback above)."""
    r = client.post(route, json=query)
    if r.status_code != 200:
        sys.exit("%s : erreur %d" % (route, r.status_code))
    return json.loads(r.data)


client = app.test_client()
horizon = post("/get_delta_on_horizon", dict(QUERY, n=4, horizon="H3", check_cache=False))
print("get_delta_on_horizon  %4d stations  empreinte %s"
      % (len(horizon["data"]), fingerprint(horizon)))
serie = post("/get_delta_serie", dict(QUERY, code=horizon["data"][0]["code"]))
print("get_delta_serie       %4d séries    empreinte %s" % (len(serie), fingerprint(serie)))
