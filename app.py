# Copyright 2024
# Louis Héraut (louis.heraut@inrae.fr)*1,
# Jean-Philippe Vidal (jean-philippe.vidal@inrae.fr)*1

# *1   INRAE, France

# This file is part of MEANDRE.

# MEANDRE is free software: you can redistribute it and/or
# modify it under the terms of the GNU General Public License as
# published by the Free Software Foundation, either version 3 of the
# License, or (at your option) any later version.

# MEANDRE is distributed in the hope that it will be useful, but
# WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
# General Public License for more details.

# You should have received a copy of the GNU General Public License
# along with MEANDRE.
# If not, see <https://www.gnu.org/licenses/>.


from flask import Flask, request, jsonify, render_template, send_file
from sqlalchemy import create_engine, text
from sqlalchemy.pool import QueuePool
from flask_cors import CORS

import numpy as np
import subprocess
import json
import sys
import hashlib
from datetime import datetime
import pandas as pd
# from scipy.interpolate import interp1d
from scipy.interpolate import UnivariateSpline
# import rpy2.robjects as robjects
import os
from dotenv import load_dotenv
# import static.py.color
from static.py import color

name_of_storylines = np.array([
    "historical-rcp85_HadGEM2-ES_ALADIN63_ADAMONT",
    "historical-rcp85_CNRM-CM5_ALADIN63_ADAMONT",
    "historical-rcp85_EC-EARTH_HadREM3-GA7_ADAMONT",
    "historical-rcp85_HadGEM2-ES_CCLM4-8-17_ADAMONT"
])
color_of_storylines = np.array([
    "#569A71",
    "#EECC66",
    "#E09B2F",
    "#791F5D"
])


def round_int(value):
    if np.isinf(value):
        return value
    elif value.is_integer():
        return int(value)
    return value


load_dotenv()
DB_USER = os.environ.get('DB_USER')
DB_PASSWORD = os.environ.get('DB_PASSWORD')
DB_HOST = os.environ.get('DB_HOST')
DB_PORT = os.environ.get('DB_PORT')
DB_NAME = os.environ.get('DB_NAME')
debug = os.environ.get('DEBUG')

current_dir = os.path.dirname(os.path.abspath(__file__))
R_dir = os.path.join(current_dir, "static", "R")
app = Flask(__name__, static_url_path='', static_folder='static')
CORS(app, resources={r"/*": {"origins": "*"}})

db_url = f'postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}'
engine = create_engine(db_url, poolclass=QueuePool)


@app.route('/')
@app.route('/plus-d-eau-ou-moins-d-eau/nord-et-sud')
@app.route('/plus-d-eau-ou-moins-d-eau/et-entre-les-deux')
@app.route('/plus-d-eau-ou-moins-d-eau/le-changement-dans-la-continuite')
@app.route('/plus-d-eau-ou-moins-d-eau/ajouter-une-pincee-de-variabilite-naturelle')
@app.route('/plus-d-eau-ou-moins-d-eau/raconter-les-trajectoires')
@app.route('/des-etiages-plus-severe/moins-d-eau-l-ete')
@app.route('/des-etiages-plus-severe/et-c-est-certain')
@app.route('/des-etiages-plus-severe/des-etiages-plus-longs')
@app.route('/des-crues-incertaines/quelle-evolution-en-france')
@app.route('/des-crues-incertaines/et-d-abord-dans-quelle-direction')
@app.route('/des-crues-incertaines/ajouter-une-louche-de-variabilite')
@app.route('/a-propos')
@app.route('/exploration-avancee')
def index():
    return render_template('index.html')



# @app.route('/api/base_url', methods=['GET'])
# def get_api_base_url():
#     print(api_base_url)
#     return jsonify({"api_base_url": api_base_url})


cache = {}
def get_hash(chr):
    return hashlib.sha256(chr.encode()).hexdigest()

@app.route('/get_delta_on_horizon', methods=['POST'])
def delta_post():
    # Get parameters from the JSON payload
    data = request.json
    n = data.get('n')
    exp = data.get('exp')
    chain = data.get('chain')
    variable = data.get('variable')
    horizon = data.get('horizon')
    check_cache = data.get('check_cache')

    chr = str(n)+exp+str(chain)+variable+horizon
    hash = get_hash(chr)
    
    if check_cache and hash in cache:
        # print("read from cache")
        response = cache[hash]

    else:
        # print("computed")
        connection = engine.connect()
        
        sql_query = f"""
        WITH hm_average AS (
        SELECT code, gcm, rcm, bc, AVG(value) AS value
        FROM delta_{exp}_{variable}_{horizon}
        WHERE chain IN :chain AND n >= {n}
        GROUP BY code, gcm, rcm, bc
        ),
        bc_average AS (
        SELECT code, AVG(value) AS value
        FROM hm_average
        GROUP BY code, gcm, rcm
        )
        SELECT s.*, b.value
        FROM stations s
        JOIN (
        SELECT code, AVG(value) AS value
        FROM bc_average
        GROUP BY code
        ) b ON s.code = b.code;
        """
        result = connection.execute(
            text(sql_query),
            {'chain': tuple(chain)}
        )
        columns = result.keys()
        rows = result.fetchall()
        data = [{f"{column_name}": value for column_name, value in zip(columns, row)} for row in rows]
        
        sql_query = f"""
        SELECT *
        FROM variables
        WHERE variable_en = :variable;
        """
        result = connection.execute(
            text(sql_query),
            {'variable': variable}
        )
        columns = result.keys()
        rows = result.fetchall()
        meta = [{f"{column_name}": value for column_name, value in zip(columns, row)} for row in rows][0]
        connection.close()

        if meta["to_normalise"]:
            meta["unit_fr"] = "%"
            meta["unit_en"] = "%"
          
        Palette = meta['palette']
        Palette = Palette.split(" ")
        meta['palette'] = Palette
      
        Code = [x['code'] for x in data]
        nCode = len(Code)
        
        Delta = [x['value'] for x in data]
        q01Delta = np.quantile(Delta, 0.01)
        q99Delta = np.quantile(Delta, 0.99)
        
        res = color.compute_colorBin(q01Delta, q99Delta,
                                     len(Palette), center=0)
        bin = res['bin']
        bin = [str(round_int(x)) for x in bin]
        
        Fill = color.get_colors(Delta, res['upBin'],
                                res['lowBin'], Palette)
        
        color_to_find = np.array(["#F6E8C3", "#C7EAE5",
                                  "#EFE2E9", "#F5E4E2"])
        color_to_switch = np.array(["#EFD695", "#A1DCD3",
                                    "#DBBECE", "#E7BDB8"])
        
        for i, d in enumerate(data):
            d['fill'] = Fill[i]
            d['fill_text'] = color.switch_color(Fill[i],
                                                color_to_find,
                                                color_to_switch)
        response = {'data': data,
                    'bin': bin}
        response.update(meta)
        response = jsonify(response)

        cache[hash] = response

    # print(sys.getsizeof(cache))
        
    return response



@app.route('/get_delta_serie', methods=['POST'])
def serie_post():
    # Get parameters from the JSON payload
    data = request.json
    code = data.get('code')
    exp = data.get('exp')
    chain = data.get('chain')
    variable = data.get('variable')

    # print("a")
    
    connection = engine.connect()

    sql_query = f"""
    SELECT chain, date, value
    FROM delta_{exp}_{variable}
    WHERE chain IN :chain AND code = '{code}';
    """

    result = connection.execute(
        text(sql_query),
        {'chain': tuple(chain)}
    )
    connection.close()
    
    columns = result.keys()
    rows = result.fetchall()

    # print("b")

    data = pd.DataFrame(rows, columns=columns)
    data['date'] = pd.to_datetime(data['date'])
    data['climate_chain'] = data['chain'].str.rsplit("_", n=1).str[0]
    data['opacity'] = "0.08"
    data['stroke_width'] = "1px"
    data['color'] = "#ADABAA"
    data['order'] = 0

    # print("c")

    for storyline in name_of_storylines:
        data_med = data[data['climate_chain'] == storyline].groupby(['date'])['value'].median().reset_index()

        data_med = data_med.dropna()
        # x = pd.to_numeric(data_med['date']) / 10**9
        # y = data_med['value']
        # x_str = ' '.join(map(str, x))
        # y_str = ' '.join(map(str, y))
        # command = [
        #     "Rscript",
        #     os.path.join(R_dir, "compute_spline.R"),
        #     "--x", x_str,
        #     "--y", y_str
        # ]
        # process = subprocess.Popen(command,
        #                            stdout=subprocess.PIPE,
        #                            stderr=subprocess.PIPE)
        # output, error = process.communicate()
        # y = output.decode().strip().split('\n')
        # data_med['value'] = pd.to_numeric(y)
        
        x = pd.to_numeric(data_med['date']) / 10**9
        y = data_med['value']
        smoothing_factor = 10**100
        spline = UnivariateSpline(x, y, s=smoothing_factor, k=4)
        y_smooth = spline(x)
        data_med['value'] = y_smooth
        
        data_med['chain'] = storyline + "_back"
        data_med['climate_chain'] = storyline + "_back"
        data_med['opacity'] = "1"
        data_med['stroke_width'] = "4px"
        data_med['color'] = "#ffffff"
        data_med['order'] = 1
        data = pd.concat([data, data_med], ignore_index=True)
        
        data_med['chain'] = storyline
        data_med['climate_chain'] = storyline
        data_med['opacity'] = "1"
        data_med['stroke_width'] = "2px"
        data_med['color'] = color_of_storylines[name_of_storylines == storyline][0]
        data_med['order'] = 2
        data = pd.concat([data, data_med], ignore_index=True)


    # print("d")
    
    data['date'] = data['date'].dt.strftime("%Y-%m-%d")
    data = data.rename(columns={'value': 'y', 'date': 'x'})

    group = ['chain', 'color', 'stroke_width', 'opacity', 'order']
    data = data.groupby(group).apply(lambda x: x[['x', 'y']].to_dict('records')).reset_index(name='values')

    data = data.sort_values(by=['order'], ascending=True)

    # print("e")
    
    json_output = []
    for index, row in data.iterrows():
        json_row = {'chain': row['chain'],
                    'color': row['color'],
                    'order': row['order'],
                    'stroke_width': row['stroke_width'],
                    'opacity': row['opacity'],
                    'values': row['values']}
        json_output.append(json_row)

    # print("f")

    json_output_cleaned = json_output.copy()
    for item in json_output_cleaned:
        for record in item['values']:
            if np.isnan(record['y']):
                record['y'] = None
   
    json_output_str = json.dumps(json_output_cleaned)
   
    return json_output_str



if __name__ == '__main__':
    app.run(debug=debug)
