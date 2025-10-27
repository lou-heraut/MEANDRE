// Copyright 2024
// Louis Héraut (louis.heraut@inrae.fr)*1,
// Jean-Philippe Vidal (jean-philippe.vidal@inrae.fr)*1

//     *1   INRAE, France

// This file is part of MEANDRE.

// MEANDRE is free software: you can redistribute it and/or
// modify it under the terms of the GNU General Public License as
// published by the Free Software Foundation, either version 3 of the
// License, or (at your option) any later version.

// MEANDRE is distributed in the hope that it will be useful, but
// WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
// General Public License for more details.

// You should have received a copy of the GNU General Public License
// along with MEANDRE.
// If not, see <https://www.gnu.org/licenses/>.

const is_production = false;
let api_base_url;
let default_n;

if (is_production) {
    api_base_url = "https://meandre-tracc.explore2.inrae.fr";
    default_n = 4;
} else {
    api_base_url = "http://127.0.0.1:5000";
    // api_base_url = "http://10.69.66.253:5000";
    default_n = 4;
}


let geoJSONdata_france, geoJSONdata_basinHydro, geoJSONdata_river, geoJSONdata_secteurHydro; // geoJSONdata_cities;//, geoJSONdata_entiteHydro;

const geoJSONfiles = [
    "/data/france.geo.json",
    "/data/regions.geo.json",
    "/data/river.geo.json",
    "/data/secteurHydro.geo.json",
    // "/data/villesFrance.geo.json"
    // "/data/entityHydro.geo.json"
];


let URL_QA = ["/","/tracc-context", "/tracc-explore"];

let URL_narratifs = ["/", 
		     "/tracc-explore",]; 

let drawer_mode = 'drawer-narratif';

let storyline1 = null;
let storyline2 = null;
let storyline3 = null;
let storyline4 = null;

let allStorylines = {
    storyline1,
    storyline2,
    storyline3,
    storyline4
};

let activeStorylines = Object.entries(allStorylines)
    .filter(([key, value]) => value !== null);

let selected_storyline = null;

$(document).ready(function() {
    // console.log("ready");
    updateContent(start=true);
});

$(window).on('popstate', function(event) {
    // console.log("popstate");
    updateContent();
});


function change_url(url, start=false, actualise=true) {
    var current_url = window.location.pathname;
    // console.log(current_url);
    if (current_url === url && url === "/exploration-avancee") {
	actualise = false;
    }
    history.pushState({}, "", url);
    updateContent(start=start, actualise=actualise);
}

// function initTitleOverlay() {
//     document.querySelectorAll('.map-title-overlay').forEach(element => {
//         const fullText = element.getAttribute('data-full');
//         const shortText = element.textContent;
//         let isExpanded = false;

//         element.addEventListener('mouseenter', function() {
//             if (!isExpanded) {
//                 element.classList.add('expanded');
//                 element.textContent = fullText;
//                 element.style.zIndex = '9999'
//                 const newWidth = element.scrollWidth;
//                 element.style.width = newWidth + 'px';
//                 isExpanded = true;
//             }
//         });

//         element.addEventListener('mouseleave', function() {
//             if (isExpanded) {
//                 element.classList.remove('expanded');
//                 element.style.width = '';
//                 element.textContent = shortText;
//                 element.style.zIndex = ''
//                 isExpanded = false;
//             }
//         });
//     });
// }


function loadGeoJSON(fileURL) {
    return d3.json(fileURL)
	.then(data => data)
	.catch(error => {
	    console.error("Error loading geojson file :", error);
	    throw error;
	});
}

function updateMaps(){
    console.log(selectedRegionId)
    // zoomToRegion(selectedRegionId, "#svg-france-QA");
    // svgFrance_QA = update_map("#svg-france-QA", svgFrance_QA, data_point=null);
    // svgFrance_QJXA = update_map("#svg-france-QJXA", svgFrance_QJXA, data_point=null);
    // svgFrance_VCN10 = update_map("#svg-france-VCN10", svgFrance_VCN10, data_point=null);
    // update_data_point_debounce()
}


function updateContent(start=false, actualise=true) {
    var url = window.location.pathname;

    // console.log("url       ", url);
    // console.log("start     ", start);
    // console.log("actualise ", actualise);
    
    if (url !== "/") {
	// console.log("a");
	hide_home();
    } else {
	// console.log("b");
	show_home();
    }
    if (start) {
	// console.log("c");
    	fetch_components(url);
    } else {
	select_tab();
	check_bar();
    }

    if (actualise) {
	const promises = geoJSONfiles.map(fileURL => loadGeoJSON(fileURL));
	Promise.all(promises)
	    .then(geoJSONdata => {
		geoJSONdata_france = geoJSONdata[0];
		geoJSONdata_basinHydro = geoJSONdata[1];
		geoJSONdata_river = geoJSONdata[2];
		// geoJSONdata_entiteHydro = geoJSONdata[2];
        geoJSONdata_secteurHydro= geoJSONdata[3]; 
        // geoJSONdata_cities= geoJSONdata[4];

        // initTitleOverlay()
        update_data_point_debounce();
        
	    });
    }

    // if (url !== "/a-propos") {
	if (start && url == "/") {
	    $("#container-gallery-map").load("/html" + "/tracc-context" + ".html", function() {
		check_url();
	    });
	    // update_data_point_debounce();
	    
	} else if (actualise && url !== "/") {
	    $("#container-gallery-map").load("/html" + url + ".html", function() {
		check_url();
	    });
	    // update_data_point_debounce();
	}
	
    // } else {
	// $("#container-gallery-map").load("/html" + url + ".html");
    // }
}


function check_url() {
    var url = window.location.pathname;
    // var selected_variable = get_variable();
    
    // if (URL_QA.includes(url) && selected_variable != "QA") {
	// var variable = document.getElementById("button-tracc40");
    // }
}


function check_url_after_data() {
    var url = window.location.pathname;
    if (URL_serie.includes(url)) {
	show_serie(data_point, "K228311002", toggle=false);
    } else {
	close_serie();
    }
}


function fetch_components(url) {
    // console.log("fetch");
    
    $.get('/html/menu.html', function(html) {
        if ($('#menu-element').length) {
            $('#menu-element').html(html);
            load_slider();
        }
    });
    $.get('/html/bar.html', function(html) {
	if ($('#bar-element').length) {
            $('#bar-element').html(html);
            select_tab();
	    check_bar();
	}
    });
}



function hide_home() {
    document.getElementById('container-home').style.display = "none";
}
function show_home() {
    document.getElementById('container-home').style.display = "flex";
}


function unique(array) {
    return array.filter(function(item, index) {
        return array.indexOf(item) === index;
    });
}

function debounce(func, delay) {
    let timerId;
    return function(...args) {
        clearTimeout(timerId);
        timerId = setTimeout(() => {
            func.apply(this, args);
        }, delay);
    };
}


let data_back;
let data_point;
let data_point_QA;
let data_point_QJXA;
let data_point_VCN10;
let data_serie;

let svgFrance_region;
let svgFrance_QA;
let svgFrance_QJXA;
let svgFrance_VCN10;

let data_indicator = ["QA", "QJXA", "VCN10_summer"]

function update_data_point() {

    var url = window.location.pathname;
    let check_cache;
    if (url === "/exploration-avancee") {
	check_cache = false; 
    } else {
	check_cache = true;
    }
    
	$('#map-QA-loading').css('display', 'flex');
	$('#map-QJXA-loading').css('display', 'flex');
	$('#map-VCN10-loading').css('display', 'flex');

    var n = default_n;
    // var variable = get_variable();
    var projection = get_projection();
    var horizon = get_horizon();
    
    // // Initialize top left for region selection
    if (start) {
        start = false
        svgFrance_region = update_map_region("#svg-france-region", svgFrance_region);
            $('#map-region-loading').css('display', 'none');
    }
    if (projection) {
        let data_all = {};

        let promises = data_indicator.map(variable => {
            const data_query = {
                horizon: horizon.H,
                check_cache: check_cache,
                region_id: selectedRegionId,
                exp: projection.exp,
                variable: variable,
                n: n,
                chain: projection.chain
            };

            return fetch(api_base_url + "/get_narrative_data", {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data_query)
            })
            .then(response => response.json())
            .then(data_back => {
                if (variable === "QA") {
                    data_all['data_point_QA'] = data_back;
                } else if (variable === "QJXA") {
                    data_all['data_point_QJXA'] = data_back;
                } else if (variable === "VCN10_summer") {
                    data_all['data_point_VCN10'] = data_back;
                }
            });
        });

        // Attendre que toutes les promesses soient finies
        Promise.all(promises).then(() => {
            return fetch(api_base_url + "/define_data_palette", {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data_all)  
            });
        })
        .then(response => response.json())
        .then(data_back => {
            data_point_QA   = data_back.data_point_QA;
            data_point_QJXA = data_back.data_point_QJXA;
            data_point_VCN10 = data_back.data_point_VCN10;
            
            zoomToRegion(selectedRegionId, "#svg-france-QA");

            // mapElements[id_svg] = {
            //     svgElement,
            //     layer_france,
            //     layer_river,
            //     layer_basin,
            //     projectionMap,
            //     container,
            //     width,
            //     height,
            //     data_back
            // };

            // redrawPoint(elements.svgElement, elements.data_point_VCN10);


            svgFrance_QA = update_map("#svg-france-QA", svgFrance_QA, data_point_QA);
            $('#map-QA-loading').css('display', 'none');
            svgFrance_QJXA = update_map("#svg-france-QJXA", svgFrance_QJXA, data_point_QJXA);
            $('#map-QJXA-loading').css('display', 'none');
            svgFrance_VCN10 = update_map("#svg-france-VCN10", svgFrance_VCN10, data_point_VCN10);
            $('#map-VCN10-loading').css('display', 'none');

            draw_colorbar(data_point_QA)
        })
        
    } else {
        // Empty maps
        svgFrance_region = update_map_region("#svg-france-region", svgFrance_region);
        $('#map-region-loading').css('display', 'none');
        svgFrance_QA = update_map("#svg-france-QA", svgFrance_QA, null);
        $('#map-QA-loading').css('display', 'none');
        svgFrance_QJXA = update_map("#svg-france-QJXA", svgFrance_QJXA, null);
        $('#map-QJXA-loading').css('display', 'none');
        svgFrance_VCN10 = update_map("#svg-france-VCN10", svgFrance_VCN10, null);
        $('#map-VCN10-loading').css('display', 'none');
    }
    
}

function selectTraccButton(selectedButton) {
	const wasSelected = selectedButton.classList.contains('selected');
    if (wasSelected) {
        return;
    }
    
    if (selectedButton) {
	var buttons = selectedButton.parentNode.querySelectorAll('button');
	buttons.forEach(function (button) {
	    button.classList.remove('selected');
	});
	selectedButton.classList.add('selected');
	// update_data_point_debounce();
    updateStorylineButton()
    }
}

function getStorylines() {
    storyline1 = null;
    storyline2 = null;
    storyline3 = null;
    storyline4 = null;

    var horizon = get_horizon();

    const data_query = {
        horizon: horizon.H,
        region_id: selectedRegionId,
    };

    return fetch(api_base_url + "/get_narrative", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data_query)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error("Erreur HTTP " + response.status);
        }
        return response.json();
    })
    .then(data => {
        // const storylines = [null, null, null, null];
        // for (let i = 0; i < data.length && i < 4; i++) {
        //     storylines[i] = data[i];
        // }

        // let storylines = data.sort((a, b) => 
        //     a.narratif_id.localeCompare(b.narratif_id)
        //     );

        let family_order = { X: 1, E: 2, C: 3, M: 4 };

        let storylines = data.sort((a, b) => {
        // Extraire la lettre et le chiffre
        const [letterA, numA] = [a.narratif_id[0], parseInt(a.narratif_id.slice(1))];
        const [letterB, numB] = [b.narratif_id[0], parseInt(b.narratif_id.slice(1))];

        // Comparer selon l’ordre de la lettre
        if (family_order[letterA] !== family_order[letterB]) {
            return family_order[letterA] - family_order[letterB];
        }

        // Si les lettres sont identiques, comparer par le nombre
        return numA - numB;
        });
        
        storyline1 = storylines[0];
        storyline2 = storylines[1];
        storyline3 = storylines[2];
        storyline4 = storylines[3];

        allStorylines = {
            storyline1,
            storyline2,
            storyline3,
            storyline4
        };

        return allStorylines; 
    });
}

let families = {
            X: "eXtrêmes",
            E: "Étiages",
            C: "Crues",
            M: "Modérés"
        };
function updateStorylineButton(reset=false){
    if (reset){
        // Reset storyline buttons and disable them
        let compteur = 1
        selected_storyline = null
        Object.entries(allStorylines)
        .forEach(([key, val]) => {
            const button = document.getElementById(`button-${key}`);
            button.classList.remove("selected")
            button.innerHTML = `<i>Narratif ${compteur}</i>`;
            button.disabled = true;
            compteur++;
        })
        const buttons = document.querySelectorAll("[id^='button-storyline']");
        buttons.forEach(btn => btn.classList.remove("selected"));
    } else {
        var init_storyline_button = true
        
        getStorylines()
        .then((allStorylines) => {Object.entries(allStorylines).forEach(([key, val]) => {
            const button = document.getElementById(`button-${key}`);
            // const button_name = document.getElementById(`button-${key}-name`);
            const cell_name = document.getElementById(`cell-${key}-name`)
            const cell_description = document.getElementById(`cell-${key}`)
            const cell_arrow = document.getElementById(`cell-${key}-arrow`);
            if (button) {
                if (val) {
                    button.disabled = false;
                    button.classList.remove("selected");
                    button.style.color = "black";
                    button.style.display = ""
                    button.value = key;

                    cell_arrow.style.color = val.narratif_couleur;
                    cell_name.style.color = val.narratif_couleur;
                    cell_name.innerHTML = `<span>${val.narratif_id}</span><br>
                                            <span class="italic">${families[val.famille_id]}</span>`;
                    cell_description.innerHTML = `
                                                <span>${val.narratif_description}<br></span>
                                                <span>GCM: ${val.gcm}, RCM: ${val.rcm}, HM: ${val.hm}</span>
                                                `;
                    
                    // cell_description.textContent = `${val.narratif_description}<br> GCM: ${val.gcm}, RCM: ${val.rcm}, HM: ${val.hm}`;
                    
                    if (init_storyline_button) {
                        init_storyline_button = false;
                        selected_storyline = val;

                        // const cell_name = document.getElementById(`cell-storyline1-name`);
                        // const cell_description = document.getElementById(`cell-storyline1`);
                        // cell_name.style.backgroundColor = stroke_basin_selected
                        // cell_description.style.backgroundColor = stroke_basin_selected

                        // const cell = document.getElementById("cell_name");
                        // cell.style.backgroundColor = selected_storyline;
                        console.log("Selected storyline:", selected_storyline);
                    }
                } else {
                    // button.textContent = " ";
                    button.value = null;
                    button.disabled = true;
                    button.style.display = "none";
                    // button.style.visibility = "hidden";
                }
            }
        });
    // Select the first button
    const buttons = document.querySelectorAll("[id^='button-storyline']");
    buttons.forEach(btn => btn.classList.remove("selected"));
    if (buttons.length > 0) buttons[0].classList.add("selected");

    // updateTable();²
    update_data_point_debounce();
    });    
       
    }
}

function selectStorylineButton(selectedButton) {
	// Update selected_storyline
    selected_storyline = allStorylines[selectedButton.value.replace(/"/g, '')]
    console.log(selected_storyline);


    // Change selected storyline button 
    if (selectedButton) {
        Object.entries(allStorylines).forEach(([key, val]) =>{
            const button = document.getElementById(`button-${key}`);
            // const button_name = document.getElementById(`button-${key}-name`);
            // const cell_name = document.getElementById(`cell-${key}-name`);
            // const cell_description = document.getElementById(`cell-${key}`);
            if (key !== selectedButton.value) {
                button.classList.remove('selected')
                // button_name.classList.remove('selected')
                // cell_name.style.backgroundColor = 'transparent'
                // cell_description.style.backgroundColor = 'transparent'
            } else {
                button.classList.add('selected')
                // button_name.classList.add('selected')
                // cell_name.style.backgroundColor = stroke_basin_selected
                // cell_description.style.backgroundColor = stroke_basin_selected
            }
        });

        // var buttons = selectedButton.parentNode.querySelectorAll('button');
        // buttons.forEach(function (button) {
        //     button.classList.remove('selected');
        // });
        // selectedButton.classList.add('selected');
        // updateTable();
        update_data_point_debounce();
    }
}

function updateTable() {
    const table_keys = ['gcm', 'rcm', 'hm']
    const table = document.getElementById("info-table");
    // on boucle sur les lignes à partir de la 2ᵉ (row[0] = en-têtes)
    for (let i = 0; i < table.rows.length; i++) {
        const key = table_keys[i]
        if (selected_storyline [key] !== undefined) {
            const cell = table.rows[i].cells[1];
            cell.textContent = selected_storyline[key]; 
            cell.classList.remove("text-gray");
            cell.style.color = "black";
            // table.rows[i].cells[1].textContent = selected_storyline[key]; // maj 2ᵉ colonne
      }
    }

    // for (let i = 1; i < table.rows.length; i++) {
    //   const key = table.rows[i].cells[0].textContent.trim(); // clé (GCM, RCM, HM)
    //   if (data_table[key] !== undefined) {
    //     table.rows[i].cells[1].textContent = data_table[key]; // maj 2ᵉ colonne
    //   }
    // }
  }

const update_data_point_debounce = debounce(update_data_point, 1000);
// update_data_point_debounce();

function update_data_serie() {
    $('#line-loading').css('display', 'flex');
    
    var variable = get_variable();
    var projection = get_projection();

    var data_query = {
	code: selected_code,
        exp: projection.exp,
        chain: projection.chain,
        variable: variable,
    };

    fetch(api_base_url + "/get_delta_serie", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data_query)
    })
    .then(response => response.json())
    .then(data_back => {
	data_serie = data_back;
	$('#line-loading').css('display', 'none');
	plot_data_serie();
    })
}
const update_data_serie_debounce = debounce(update_data_serie, 1000);


// window.addEventListener('resize', function() {
//     plot_data_serie();
// });

// function plot_data_serie() {
//     if (data_serie) {
// 	var url = window.location.pathname;
// 	if (URL_noSL.includes(url)) {
// 	    data_serie = data_serie.filter(item => item.order === 0);
// 	}
	
// 	d3.select("#svg-line").selectAll("*").remove();
// 	var svgContainer = d3.select("#svg-line");

// 	var svgNode = d3.select("#grid-line").node();
// 	var computedStyle = window.getComputedStyle(svgNode);
// 	var paddingLeft = parseFloat(computedStyle.paddingLeft);
// 	var paddingRight = parseFloat(computedStyle.paddingRight);
// 	var containerPadding = paddingLeft + paddingRight;
// 	var svgWidth = svgNode.getBoundingClientRect().width - containerPadding;
	
// 	var svgHeight_min = 250;
// 	var svgHeight = Math.max(svgHeight_min,
// 				 +svgContainer.node().getBoundingClientRect().height);
	
// 	var margin = { top: 10, right: 10, bottom: 20, left: 40 };
// 	var width = svgWidth - margin.left - margin.right;
// 	var height = svgHeight - margin.top - margin.bottom;

// 	var svg = svgContainer
// 	    .attr("width", width + margin.left + margin.right)
// 	    .attr("height", height + margin.top + margin.bottom)
// 	    .append("g")
// 	    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// 	data_serie.forEach(function(line) {
// 	    line.values.forEach(function(d) {
// 		d.x = new Date(d.x);
// 	    });
// 	});
	
// 	var xScale = d3.scaleTime()
// 	    .domain(d3.extent(data_serie[0].values, function(d) { return d.x; }))
// 	    .range([0, width]);

// 	var yScale = d3.scaleLinear()
// 	    .domain([
// 		d3.min(data_serie, function(line) {
// 		    return d3.min(line.values, function(d) { return d.y; });
// 		}),
// 		d3.max(data_serie, function(line) {
// 		    return d3.max(line.values, function(d) { return d.y; });
// 		})
// 	    ])
// 	    .range([height, 0]);

// 	// Define axes
// 	if (window.innerWidth < 768) {
//             xAxis = d3.axisBottom(xScale)
//                 .tickSize(0)
// 		.tickSizeInner(5)
//                 .tickFormat(d3.timeFormat("%Y"))
//                 .ticks(d3.timeYear.every(20)); // Show ticks every 20 years
//         } else {
//             xAxis = d3.axisBottom(xScale)
//                 .tickSize(0)
// 		.tickSizeInner(5)
//                 .tickFormat(d3.timeFormat("%Y"))
//                 .ticks(d3.timeYear.every(10)); // Show ticks every 10 years by default
//         }

// 	var customTickFormat = function(d) {
// 	    return d > 0 ? "+" + d : d;
// 	};
	
// 	var yAxis = d3.axisLeft().scale(yScale)
// 	    .tickSize(0)
// 	    .tickSizeInner(-width)
// 	    .ticks(5)
// 	    .tickPadding(6)
// 	    .tickFormat(customTickFormat);
	
// 	// Append axes
// 	svg.append("g")
// 	    .attr("class", "x axis")
// 	    .attr("transform", "translate(0," + height + ")")
// 	    .call(xAxis)
// 	    .selectAll("text")
//             .style("fill", "grey")
//             .style("font-size", "12px");

// 	svg.selectAll('.x.axis').selectAll("line")
// 	    .style("stroke", "#ccc");
// 	svg.select(".x.axis").select(".domain")
// 	    .style("stroke", "#aaa");
	
// 	svg.append("g")
//     	    .attr("class", "y axis")
//     	    .call(yAxis)
//     	    .selectAll("text")
//             .style("fill", "grey")
//             .style("font-size", "12px");
	
// 	svg.selectAll('.y.axis').selectAll("line")
// 	    .style("stroke", "#ccc")
// 	    .filter(function(d) { return d === 0; })
// 	    .remove();

// 	svg.select(".y.axis").select(".domain").remove();

// 	var line = d3.line()
// 	    .x(function(d) { return xScale(d.x); })
// 	    .y(function(d) { return yScale(d.y); });

// 	var tooltip = d3.select("#grid-line_tooltip");

// 	var lines = svg.selectAll(".line")
// 	    .data(data_serie)
// 	    .enter().append("path")
// 	    .attr("class", "line")
// 	    .attr("fill", "none")
// 	    .attr("id", function(d) { return d.chain; })
// 	    .attr("d", function(d) { return line(d.values); })
// 	    .attr("opacity", function(d) { return d.opacity; })
// 	    .attr("stroke", function(d) { return d.color; })
// 	    .attr("stroke-width", function(d) { return d.stroke_width; });
	
// 	lines.on("mouseover", function(event, d) {
// 	    if (d.order === 2) {
// 		d3.select(this)
// 		    .attr("stroke-width", "2px");
// 		d3.select("#" + d.chain + "_back")
// 		    .attr("stroke-width", "5px");
// 		tooltip.style("opacity", 1)
// 		    .style("color", d.color)
// 		    .html(d.chain.replace(/_/g, " "));
		
// 	    } else if (d.order === 0) {
// 		d3.select(this)
// 		    .attr("opacity", "1");
// 		tooltip.style("opacity", 1)
// 		    .style("color", d.color)
// 		    .html(d.chain.replace(/_/g, " "));
// 	    }
// 	});
// 	lines.on("mouseout", function(event, d) {
//             d3.select(this)
// 		.attr("opacity", d.opacity)
// 		.attr("stroke-width", d.stroke_width);
// 	    if (d.order === 2) {
// 		d3.select("#" + d.chain + "_back")
// 		    .attr("stroke-width", "3px");
// 	    }
//             tooltip.style("opacity", 0);
// 	});
	
// 	svg.append("line")
// 	    .attr("class", "zero-line")
// 	    .attr("x1", 0)
// 	    .attr("y1", yScale(0))
// 	    .attr("x2", width)
// 	    .attr("y2", yScale(0))
// 	    .style("stroke", "#555")
// 	    .style("stroke-dasharray", ("3, 3"))
// 	    .style("stroke-width", 1);
//     }
// }




function update_grid(data_back) {

    var variable = data_back.variable_fr;
    if (variable.includes("_")) {
	variable = variable.match(/([^_]*)_/)[1];
    }
    
    var n = default_n;
    var horizon = get_horizon();
    
    const months = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
		    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
    var sampling_period = data_back.sampling_period_fr;    
    if (sampling_period.includes(",")) {
	sampling_period = sampling_period.split(", ")
	sampling_period_start = months[sampling_period[0].match(/-(\d+)/)[1] -1];
	sampling_period_end = months[sampling_period[1].match(/-(\d+)/)[1] -1];
	sampling_period = "de " + sampling_period_start + " à fin " + sampling_period_end;
	
    } else if (sampling_period.includes("-")) {
	sampling_period = months[sampling_period.match(/-(\d+)/)[1] -1];
	sampling_period = "débutant en " + sampling_period;
    } else {
	sampling_period = "débutant au " + sampling_period.toLowerCase();
    }    
    
    // document.getElementById("grid-variable_variable").textContent = variable;
    // document.getElementById("grid-variable_sampling-period").innerHTML = "Année hydrologique " + sampling_period;
    // document.getElementById("grid-variable_name").innerHTML = data_back.name_fr;
    
    // document.getElementById("grid-horizon_name").innerHTML = "Horizon " + horizon.name;

    // horizon_period = horizon.period.replace(/ - /g, "</b> à <b>");
    // document.getElementById("grid-horizon_period-l1").innerHTML = "Période futur de <b>" + horizon_period + "</b>";
    // document.getElementById("grid-horizon_period-l2").innerHTML = "Période de référence de <b>1991</b> à <b>2020</b>";

    // $(".grid-n_text").css("display", "flex");
    // document.getElementById("grid-n_number").innerHTML = n;
    
    // var url = window.location.pathname;
    // if (url === "/exploration-avancee") {
	// $("#grid-chain_drawer-narratif").css("display", "none");
	// $("#grid-chain_drawer-RCP").css("display", "none");
	// $("#grid-chain_drawer-chain").css("display", "none");
	
	// if (drawer_mode === "drawer-narratif") {
	//     $("#grid-chain_drawer-narratif").css("display", "flex");
	    
	// } else if (drawer_mode === "drawer-RCP") {
    // 	    $("#grid-chain_drawer-RCP").css("display", "flex");

	//     var RCP_value = get_RCP_value();
	//     $("#grid-chain_RCP26-text").css("display", "none");
	//     $("#grid-chain_RCP45-text").css("display", "none");
	//     $("#grid-chain_RCP85-text").css("display", "none");
	    
	//     if (RCP_value === "26") {
	// 	$("#grid-chain_RCP26-text").css("display", "block");
	//     } else if (RCP_value === "45") {
	// 	$("#grid-chain_RCP45-text").css("display", "block");
	//     } else if (RCP_value === "85") {
	// 	$("#grid-chain_RCP85-text").css("display", "block");
	//     }
	    
	// } else if (drawer_mode === "drawer-chain") {
    $("#grid-chain_drawer-chain").css("display", "flex");
	// }
    // }
    
}



function close_serie() {
    selected_code = null;
    var url = window.location.pathname;
    if (url !== "/a-propos") {
	document.getElementById("grid-point_cross").parentNode.style.display = "none";
	document.getElementById("grid-line_cross").parentNode.style.display = "none";
	highlight_selected_point();
    }
}


function make_list(from, to) {
    const result = [];
    for (let i = from; i <= to; i++) {
        result.push(i);
    }
    return result;
}


function draw_colorbar(data_back) {
    // Get the bins and palette
    var unit = data_back.unit_fr;
    unit = /année/.test(unit) ? "jours" : unit; // for débutBE
    unit = /jour/.test(unit) ? "jours" : unit; // for dtBE
    var bin = data_back.bin.slice(1, -1).reverse();
    var Palette = data_back.palette.reverse();
    var step = 25;
    var shift = 20;

    // Select the SVG and convert it to a DOM node
    const svg = d3.select("#svg-colorbar");
    const svgNode = svg.node();
    svg.selectAll("*").remove();

    // Calculate and set initial SVG dimensions
    // svg.attr("height", (Palette.length - 1) * step + shift * 2);
    svg.attr("height", "100%");
    svg.attr("width", "100%");

    // Update tick lines
    const lines = svg.selectAll(".tick-line")
        .data(bin);

    lines.enter()
        .append("line")
        .attr("x1", 5)
        .attr("x2", 15)
        .style("stroke", "#3d3e3e")
        .style("stroke-width", "1px")
        .merge(lines)
        .attr("y1", (d, i) => i * step + step / 2 + shift)
        .attr("y2", (d, i) => i * step + step / 2 + shift);
    lines.exit().remove();

    // Update bin text
    const texts = svg.selectAll(".bin-text")
        .data(bin);
    texts.enter()
        .append("text")
        .attr("x", 28)
        .style("fill", "#3d3e3e")
        .style("font-family", "Lato, sans-serif")
        .style("font-weight", "600")
        .merge(texts)
        .attr("y", (d, i) => i * step + step / 2 + shift + 4)
        .html(d => {
            d = d > 0 ? "+" + d : d;
            d = d == 0 ? d : `<tspan>${d}</tspan>&nbsp;<tspan class="colorbar-unit" style="fill: #70757A; font-size: 9pt;">${unit}</tspan>`;
            return d;
        });
    texts.exit().remove();

    // Update color circles
    var selected_color = null;
    const circles = svg.selectAll(".color-circle")
        .data(Palette);
    circles.enter()
        .append("circle")
        .attr("class", "color-circle")
        .attr("cx", 10)
        .attr("r", 6)
        .merge(circles)
        .attr("cy", (d, i) => i * step + shift)
        .attr("fill", d => d)
        .on("mouseover", function(event, d) {
            d3.select(this).attr("r", 7);
        })
        .on("mouseout", function(event, d) {
            if (this.getAttribute('fill') !== selected_color) {
                d3.select(this).attr("r", 6);
            }
        })
        .each(function(d, i) {
            d3.select(this)
                .on("click", function(event, d) {
                    var clicked_color = d;
                    var clicked_ID, clicked_Ticks;

                    if (i < Palette.length / 2) {
                        clicked_ID = make_list(0, i);
                        clicked_Ticks = clicked_ID;
                    } else {
                        clicked_ID = make_list(i, Palette.length - 1);
                        clicked_Ticks = make_list(i - 1, Palette.length - 1);
                    }
                    var clicked_Colors = clicked_ID.map(id => Palette[id]);

                    if (selected_color === clicked_color) {
                        d3.select("#svg-france").selectAll(".point")
                            .attr("opacity", 1);
                        selected_color = null;
                        svg.selectAll(".color-circle, .tick-line, .bin-text")
                            .attr("opacity", 1)
                            .attr("r", 6);
                    } else {
                        selected_color = clicked_color;
                        d3.select("#svg-france").selectAll(".point")
                            .attr("opacity", function(d) {
                                return clicked_Colors.includes(d.fill) ? 1 : 0.1;
                            });

                        svg.selectAll(".color-circle")
                            .attr("opacity", function() {
                                return clicked_Colors.includes(this.getAttribute('fill')) ? 1 : 0.3;
                            });
                        svg.selectAll(".tick-line")
                            .attr("opacity", function(d, j) {
                                return clicked_Ticks.includes(j) ? 1 : 0.3;
                            });
                        svg.selectAll(".bin-text")
                            .attr("opacity", function(d, j) {
                                return clicked_Ticks.includes(j) ? 1 : 0.3;
                            });
                    }
                });
        });
    // circles.exit().remove();

    // Ensure width and height are set to prevent distortion
    const bbox = svgNode.getBBox();  // Get bounding box of the content
    const grid_colorbar = document.getElementById("grid-colorbar");
    svgNode.setAttribute("viewBox", `${bbox.x - 2} ${bbox.y - 2} ${bbox.width + 2} ${bbox.height + 2}`);  // Set viewBox
    svgNode.setAttribute("width", 0.9*grid_colorbar.clientWidth);  // Set width
    svgNode.setAttribute("height", 0.85*grid_colorbar.clientHeight);  // Set height
    svgNode.setAttribute("preserveAspectRatio", "xMidYMid meet");  // Preserve aspect ratio
}




let selected_code = null;

const fill_entiteHydro = "transparent";
const stroke_entiteHydro = "#000000";

const fill_france = "transparent";
const stroke_france = "#89898A";
const fill_basinHydro = "transparent";
const stroke_basinHydro = "#ACACAD";
const stroke_secteurHydro = "#bcbcbeff";
const stroke_basin_selected = "#7BBFBA80";
let selectedRegionId = null;
const stroke_river = "#B0D9D6";
const stroke_river_selected = "#7BBFBA";
const stroke_secteur_selected = "#636363ff"

const minZoom = 1;
const maxZoom = 10;
const maxPan = 0.3;
const scale = 3.5;

const transitionDuration = 500;

const k_simplify_ref = 0.1;
let k_simplify = k_simplify_ref;

const riverLength_max = 0.4;
const riverLength_min = 0;
// let riverLength = riverLength_max;
let riverLength;

const strokeWith_france = 2;
const strokeWith_basinHydro = 1;
const strokeWith_river_max = 1.5;
const strokeWith_river_min = 0.4;
const strokeWith_secteurHydro = 0.7

let width = window.innerHeight;
let height = window.innerHeight;

let projectionMap;

let currentZoomLevel = 1;


function update_map_region(id_svg, svgElement) {

    riverLength = riverLength_max;
    
    d3.select(id_svg).selectAll("*").remove();

    var fact = 2;

    function redrawMap() {
        const pathGenerator = d3.geoPath(projectionMap);
        const selectedGeoJSON_river = {
            type: "FeatureCollection",
            features: geoJSONdata_river.features.filter((d) => {
            return d.properties.norm >= riverLength;
            })
        };
        const simplifiedselectedGeoJSON_river = geotoolbox.simplify(selectedGeoJSON_river, { k: k_simplify, merge: false });
        const simplifiedGeoJSON_basinHydro = geotoolbox.simplify(geoJSONdata_basinHydro, { k: k_simplify, merge: false });
        const simplifiedGeoJSON_france = geotoolbox.simplify(geoJSONdata_france, { k: k_simplify, merge: false });
        // const selectedGeoJSON_river = geotoolbox.filter(geoJSONdata_river, (d) => d.norm >= riverLength);

        layer_river.selectAll("path.river")
            .data(simplifiedselectedGeoJSON_river.features)
            .join("path")
            .attr("class", "river")
                .attr("fill", "transparent")
            .attr("stroke", stroke_river)
            .attr("stroke-width", function(d) {
            return strokeWith_river_max - (1 - d.properties.norm) * (strokeWith_river_max - strokeWith_river_min);
            })
            .attr("stroke-linejoin", "miter")
            .attr("stroke-linecap", "round")
            .attr("stroke-miterlimit", 1)
            .attr("d", pathGenerator)

            .transition()
            .duration(10);

        // let selectedRegionId = null;
        layer_basin.selectAll("path.basinHydro")
            .data(simplifiedGeoJSON_basinHydro.features, d => d.properties.name)  // clé unique
            .join("path")
            .attr("class", "basinHydro")
            .style("pointer-events", "all")
            .attr("fill", d => d.properties.name === selectedRegionId ? stroke_basin_selected : fill_basinHydro)
            .attr("stroke", stroke_basinHydro)
            .attr("stroke-width", strokeWith_basinHydro)
            .attr("stroke-linejoin", "miter")
            .attr("stroke-miterlimit", 1)
            .attr("d", pathGenerator)
            .on("click", function(event, d) {
                // if (selectedRegionId === d.properties.name) {
                //     selectedRegionId = null;  // désélection
                //     document.getElementById("panel-hover_basin").style.display = "none";
                //     updateStorylineButton(reset=true)
                // } else {
                if (selectedRegionId !== d.properties.name) {
                    selectedRegionId = d.properties.name;  // sélection
                    document.getElementById("panel-hover_basin").style.display = "block";
                    document.getElementById("panel-hover-content_basin").innerHTML =
                        "<span style='font-weight: 900; color:" + selectedRegionId ? `${ d.properties.description}` : "Aucun bassin sélectionné" + "'>" +
                        d.properties.TopoOH + "</span>"; 

                    // Met à jour le fill des polygones
                    layer_basin.selectAll("path.basinHydro")
                        .attr("fill", d => d.properties.name === selectedRegionId ? stroke_basin_selected : fill_basinHydro);

                    redrawMap();
                    // zoomToRegion(selectedRegionId, "#svg-france-QA")
                    updateStorylineButton();
                    // updateMaps();
                    
                }
                
            })
            .attr("cursor", "pointer")
            .each(function() {
                // stocke la couleur originale dans l'élément lui-même
                d3.select(this).attr("data-original-fill", d3.select(this).attr("fill"));
            })
            .on("mouseover", function(event, d) {
                d3.select(this).attr("fill", stroke_basin_selected); // couleur au survol
            })
            .on("mouseout", function(event, d) {
                const original = d3.select(this).attr("data-original-fill");
                d3.select(this).attr("fill", original); // restaure la couleur originale
            })
            .transition()
            .duration(1000);    
        
        layer_france.selectAll("path.france")
            .data(simplifiedGeoJSON_france.features)
            .join("path")
            .attr("class", "france")
            .style("pointer-events", "none")
                .attr("fill", fill_france)
            .attr("stroke", stroke_france)
            .attr("stroke-width", strokeWith_france)
            .attr("stroke-linejoin", "miter")
            .attr("stroke-miterlimit", 1)
            .attr("d", pathGenerator)
            .transition()
            .duration(1000);

        // if (data_back) {
        //     redrawPoint(svgElement, data_back, projectionMap);
        //     highlight_selected_point();
        // }
    }
    const redrawMap_debounce = debounce(redrawMap, 100);

    // window.addEventListener("resize", handleResize.bind(null, k_simplify, riverLength));
    
    const root = d3.select(id_svg)
    .attr("width", "100%")
    .attr("height", "100%");

    root.selectAll("*").remove();

    svgElement = root.append("g");
    const layer_france = svgElement.append("g").attr("class", "layer-france");
    const layer_river = svgElement.append("g").attr("class", "layer-river");
    const layer_basin = svgElement.append("g").attr("class", "layer-basinHydro");


    
    // Dimensions
    const container = document.querySelector("#grid-mini-map_map");
    let width, height;
    width = container.clientWidth
    height = container.clientHeight

    // Marge pour éviter que la carte touche les bords
    const margin = 5;
    const mapWidth = width - margin * 2;
    const mapHeight = height - margin * 2;

    // Projection avec fitSize - calcule automatiquement scale et translate
    const projectionMap = d3.geoMercator()
    .fitExtent([[-margin, margin], [width - margin, height - 2*margin]], geoJSONdata_france);


    redrawMap_debounce();
    
    // window.addEventListener("resize", handleResize.bind(null, k_simplify, riverLength));
    
    return svgElement
}

const mapIds = ["#svg-france-QA", "#svg-france-QJXA", "#svg-france-VCN10"];

let sharedZoom;
let isSyncingZoom = false; // Flag pour éviter les boucles

// Stockage des éléments de chaque carte
const mapElements = {};


function update_map(id_svg, svgElement, data_back) {
    riverLength = riverLength_max;
    
    d3.select(id_svg).selectAll("*").remove();

    var fact = 2;

    const root = d3.select(id_svg)
        .attr("width", "100%")
        .attr("height", "100%");

    root.selectAll("*").remove();

    svgElement = root.append("g");
    const layer_france = svgElement.append("g").attr("class", "layer-france");
    const layer_river = svgElement.append("g").attr("class", "layer-river");
    const layer_basin = svgElement.append("g").attr("class", "layer-basinHydro");
    const layer_secteur = svgElement.append("g").attr("class", "layer-secteurHydro");
    const layer_city = svgElement.append("g").attr("class", "layer-cityFrance");

    // Dimensions
    const indicator = id_svg.split("-").pop();
    const container = document.querySelector(`#map-${indicator}`);
    let width = container.clientWidth;
    let height = container.clientHeight;

    // Marge pour éviter que la carte touche les bords
    const margin = 10;

    // Projection avec fitExtent
    const projectionMap = d3.geoMercator()
        .fitExtent([[margin, margin], [width - margin, height - margin]], geoJSONdata_france);

    // État pour tracker les éléments survolés
    const hoverState = {
        hoveredRiver: null,
        hoveredSecteur: null
    };

    // Stocker les éléments de cette carte
    mapElements[id_svg] = {
        svgElement,
        layer_france,
        layer_river,
        layer_basin,
        layer_secteur,
        layer_city,
        projectionMap,
        container,
        width,
        height,
        data_back,
        hoverState
    };

    // Fonction helper pour tester si un point est dans un path SVG
    function isPointInPath(pathElement, x, y) {
        try {
            const point = new DOMPoint(x, y);
            return pathElement.isPointInFill(point);
        } catch (e) {
            return false;
        }
    }

    // Fonction redrawMap spécifique à cette carte
    function redrawMap(mapId) {
        const elements = mapElements[mapId];
        if (!elements) return;

        const pathGenerator = d3.geoPath(elements.projectionMap);
        const selectedGeoJSON_river = {
            type: "FeatureCollection",
            features: geoJSONdata_river.features.filter((d) => {
                return d.properties.norm >= riverLength;
            })
        };
        const simplifiedselectedGeoJSON_river = geotoolbox.simplify(selectedGeoJSON_river, { k: k_simplify, merge: false });
        const simplifiedGeoJSON_basinHydro = geotoolbox.simplify(geoJSONdata_basinHydro, { k: k_simplify, merge: false });
        const simplifiedGeoJSON_secteurHydro = geotoolbox.simplify(geoJSONdata_secteurHydro, { k: k_simplify, merge: false });
        const simplifiedGeoJSON_france = geotoolbox.simplify(geoJSONdata_france, { k: k_simplify, merge: false });

        // Couche rivières
        elements.layer_river.selectAll("path.river")
            .data(simplifiedselectedGeoJSON_river.features)
            .join("path")
            .attr("class", "river")
            .attr("fill", "transparent")
            .attr("stroke", stroke_river)
            .attr("stroke-width", function(d) {
                return strokeWith_river_max - (1 - d.properties.norm) * (strokeWith_river_max - strokeWith_river_min);
            })
            .attr("stroke-linejoin", "miter")
            .attr("stroke-linecap", "round")
            .attr("stroke-miterlimit", 1)
            .style("pointer-events", "none")
            .attr("d", pathGenerator);

        // Couche bassins
        elements.layer_basin.selectAll("path.basinHydro")
            .data(simplifiedGeoJSON_basinHydro.features, d => d.properties.name)
            .join("path")
            .attr("class", "basinHydro")
            .style("pointer-events", "none")
            .attr("fill", fill_basinHydro)
            .attr("stroke", stroke_basinHydro)
            .attr("stroke-width", strokeWith_basinHydro)
            .attr("stroke-linejoin", "miter")
            .attr("stroke-miterlimit", 1)
            .attr("d", pathGenerator);

        // Couche secteurs
        const secteursInBasin = {
            type: "FeatureCollection",
            name: simplifiedGeoJSON_secteurHydro.name,
            features: simplifiedGeoJSON_secteurHydro.features.filter(
                feature => feature.properties.region_id === selectedRegionId
            )
        };

        elements.layer_secteur.selectAll("path.secteurHydro")
            .data(secteursInBasin.features, d => d.properties.name)
            .join("path")
            .attr("class", "secteurHydro")
            .style("pointer-events", "none")
            .attr("fill", fill_basinHydro)
            .attr("stroke", stroke_secteurHydro)
            .attr("stroke-width", strokeWith_secteurHydro)
            .attr("stroke-linejoin", "miter")
            .attr("stroke-miterlimit", 1)
            // .style("opacity", 0.5)
            .attr("d", pathGenerator);

        // Couche France
        elements.layer_france.selectAll("path.france")
            .data(simplifiedGeoJSON_france.features)
            .join("path")
            .attr("class", "france")
            .style("pointer-events", "none")
            .attr("fill", fill_france)
            .attr("stroke", stroke_france)
            .attr("stroke-width", strokeWith_france)
            .attr("stroke-linejoin", "miter")
            .attr("stroke-miterlimit", 1)
            .attr("d", pathGenerator)
            
            .transition()
            .duration(1000);
            
        if (elements.data_back) {
            redrawPoint(elements.svgElement, elements.data_back, elements.projectionMap);
            highlight_selected_point();
        }
    }

    // Créer ou réutiliser le zoom partagé
    if (!sharedZoom) {
        const redrawMap_debounce = debounce((mapIds) => {
            mapIds.forEach(mapId => redrawMap(mapId));
        }, 100);

        sharedZoom = d3.zoom()
            .scaleExtent([minZoom, maxZoom])
            .translateExtent([[-width * maxPan, -height * maxPan], [width * (1 + maxPan), height * (1 + maxPan)]])
            .on("zoom", function (event) {
                if (isSyncingZoom) return;

                // Logique métier du zoom
                riverLength = riverLength_max - (event.transform.k - minZoom)/(maxZoom-minZoom)*(riverLength_max-riverLength_min);
                k_simplify = k_simplify_ref + (event.transform.k - minZoom)/(maxZoom-minZoom)*(1-k_simplify_ref);
                
                const mapIds = ["#svg-france-QA", "#svg-france-QJXA", "#svg-france-VCN10"];
                
                isSyncingZoom = true;
                
                // Appliquer la transformation à toutes les cartes
                mapIds.forEach(mapId => {
                    const mapRoot = d3.select(mapId);
                    const mapSvgElement = mapRoot.select("g");
                    const mapData = mapElements[mapId];
                    
                    if (!mapSvgElement.empty() && mapData) {
                        mapSvgElement.attr("transform", event.transform);
                        mapSvgElement.style("width", mapData.width * event.transform.k + "px");
                        mapSvgElement.style("height", mapData.height * event.transform.k + "px");
                        
                        // Mettre à jour l'état du zoom
                        mapRoot.property("__zoom", event.transform);
                    }
                });
                
                isSyncingZoom = false;
                
                // Redessiner toutes les cartes
                redrawMap_debounce(mapIds);
                highlight_selected_point();
            });
    }

    // Application du zoom
    root.call(sharedZoom);
    
    // Gestion du hover pour rivières et secteurs
    root.on("mousemove", function(event) {
        const [x, y] = d3.pointer(event, svgElement.node());
        
        let riverFound = false;
        let secteurFound = false;
        
        // Cherche quelle rivière est sous la souris
        layer_river.selectAll("path.river").each(function(riverData) {
            const isInPath = isPointInPath(this, x, y);
            
            if (isInPath && !riverFound) {
                // Rivière survolée
                if (hoverState.hoveredRiver !== this) {
                    // Enlever la surbrillance de la rivière précédente
                    if (hoverState.hoveredRiver) {
                        d3.select(hoverState.hoveredRiver).attr("stroke", stroke_river);
                    }
                    
                    hoverState.hoveredRiver = this;
                    d3.select(this).attr("stroke", stroke_river_selected);
                    document.getElementById("panel-hover_description").style.display = "block";
                    document.getElementById("panel-hover-content_description").innerHTML =
                        "<span style='font-weight: 900; color:" + stroke_river_selected + "'>" +
                        riverData.properties.TopoOH + "</span>";
                }
                riverFound = true;
            }
        });
        
        // Si aucune rivière trouvée, désactiver l'affichage
        if (!riverFound && hoverState.hoveredRiver) {
            d3.select(hoverState.hoveredRiver).attr("stroke", stroke_river);
            document.getElementById("panel-hover_description").style.display = "none";
            hoverState.hoveredRiver = null;
        }
        
        // Cherche quel secteur est sous la souris
        layer_secteur.selectAll("path.secteurHydro").each(function(secteurData) {
            const isInPath = isPointInPath(this, x, y);
            
            if (isInPath && !secteurFound) {
                // Secteur survolé
                if (hoverState.hoveredSecteur !== this) {
                    // Enlever la surbrillance du secteur précédent
                    if (hoverState.hoveredSecteur) {
                        d3.select(hoverState.hoveredSecteur).attr("stroke", stroke_secteurHydro);
                    }
                    
                    hoverState.hoveredSecteur = this;
                    d3.select(this).attr("stroke", stroke_secteur_selected).raise();
                    document.getElementById("panel-hover_secteur").style.display = "block";
                    document.getElementById("panel-hover-content_secteur").innerHTML =
                        "<span style='font-weight: 900; color:"+stroke_secteur_selected+"'>" +
                        secteurData.properties.secteur_name + "</span>";
                }
                secteurFound = true;
            }
        });
        
        // Si aucun secteur trouvé, désactiver l'affichage
        if (!secteurFound && hoverState.hoveredSecteur) {
            d3.select(hoverState.hoveredSecteur).attr("stroke", stroke_secteurHydro);
            document.getElementById("panel-hover_secteur").style.display = "none";
            hoverState.hoveredSecteur = null;
        }
    });

    // Désactiver quand la souris quitte le SVG
    root.on("mouseleave", function() {
        if (hoverState.hoveredRiver) {
            d3.select(hoverState.hoveredRiver).attr("stroke", stroke_river);
            document.getElementById("panel-hover_code").style.display = "none";
            hoverState.hoveredRiver = null;
        }
        if (hoverState.hoveredSecteur) {
            d3.select(hoverState.hoveredSecteur).attr("stroke", stroke_secteurHydro);
            document.getElementById("panel-hover_secteur").style.display = "none";
            hoverState.hoveredSecteur = null;
        }
    });
    
    // Dessiner la carte initiale
    redrawMap(id_svg);

    return svgElement;
}

// Fonction pour zoomer sur une région spécifique (sans redessiner la carte)
function zoomToRegion(selectedRegionId, svgId) {
    if (!selectedRegionId) return;
    
    // Récupérer l'indicateur et le conteneur
    const indicator = svgId.replace("#", "").split("-").pop();
    const container = document.querySelector(`#map-${indicator}`);
    const root = d3.select(svgId);
    
    if (!container) {
        console.error(`Container not found for: #map-${indicator}`);
        return;
    }
    
    if (root.empty()) {
        console.error(`SVG element not found: ${svgId}`);
        return;
    }
    
    // Dimensions du conteneur
    const width = container.clientWidth;
    const height = container.clientHeight;
    const margin = 10;
    
    // Recréer la même projection que dans update_map
    const projectionMap = d3.geoMercator()
        .fitExtent([[margin, margin], [width - margin, height - margin]], geoJSONdata_france);
    
    // Trouver la région sélectionnée
    const simplifiedGeoJSON_basinHydro = geotoolbox.simplify(geoJSONdata_basinHydro, { k: k_simplify, merge: false });
    const selectedFeature = simplifiedGeoJSON_basinHydro.features.find(f => f.properties.name === selectedRegionId);
    
    if (!selectedFeature) {
        console.warn(`Region not found: ${selectedRegionId}`);
        return;
    }
    
    // Calculer les bounds de la région
    const path = d3.geoPath(projectionMap);
    const bounds = path.bounds(selectedFeature);
    const bboxMargin = 20;
    
    const dx = bounds[1][0] - bounds[0][0];
    const dy = bounds[1][1] - bounds[0][1];
    const x = (bounds[0][0] + bounds[1][0]) / 2;
    const y = (bounds[0][1] + bounds[1][1]) / 2;
    
    // Calculer l'échelle et la translation
    const scale = Math.min((width - 2 * bboxMargin) / dx, (height - 2 * bboxMargin) / dy) * 0.9;
    const translate = [width / 2 - scale * x, height / 2 - scale * y];

    // Appliquer la transformation avec animation fluide
    root.transition()
        .duration(2000)
        .ease(d3.easeQuadInOut)
        .call(sharedZoom.transform, d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale));
}


function isMapZoomed() {
    return k_simplify !== k_simplify_ref;
}


function highlight_selected_point() {

    if (selected_code) {
	const svg = d3.select("#svg-france");
	svg.selectAll(".point.clicked")
            .attr("stroke-width", 0)
            .attr("r", 3)
            .classed("clicked", false);
	
	if (selected_code !== null) {
        const svg = d3.select("#svg-france");

        svg.selectAll(".point.clicked")
		.attr("stroke-width", 0)
		.attr("r", 3)
		.classed("clicked", false);

        var clickedPoint = svg.selectAll(".point")
		.filter(function(d) {
                    return d.code === selected_code;
		});

	    if (clickedPoint.node()) {
		clickedPoint
		    .attr("r", 4)
		    .attr("stroke", "#080505ff")
		    .attr("stroke-width", 1)
		    .classed("clicked", true);

		var parentNode = clickedPoint.node().parentNode;
		parentNode.appendChild(clickedPoint.node());
	    }
	}
    }
}


function find_code_in_data(data_back, code) {
    return data_back.data.find(item => item.code === code);
}

// function hide_serie() {
//     selected_code = null;
//     document.getElementById("grid-point").style.display = "none";
//     document.getElementById("grid-line").style.display = "none";
// }

function show_serie(data_back, code, toggle=true) {
    var point = find_code_in_data(data_back, code);
    
    if (selected_code === point.code && toggle) {
	selected_code = null;
	document.getElementById("grid-point").style.display = "none";
	document.getElementById("grid-line").style.display = "none";
    } else {
	selected_code = point.code;
	document.getElementById("grid-point").style.display = "flex";
	document.getElementById("grid-line").style.display = "flex";
    }
    highlight_selected_point();
    update_data_serie_debounce();

    document.getElementById("grid-point_code").innerHTML =
	"<span style='font-weight: 900; color:" + point.fill_text + ";'>" +
	point.code + "</span>";

    // const value = point.value.toFixed(2);
    // document.getElementById("grid-point_value").innerHTML =
    //     "<span style='color:" + point.fill_text + ";'>" +
    //     "<span style='font-weight: 900;'>" +
    //     (value > 0 ? "+" : "") + value + " </span>%</span>";
    
    document.getElementById("grid-point_name").innerHTML = point.name;

    document.getElementById("grid-point_hr").innerHTML =
	"<span class='text-light'>Région hydrologique: </span>" +
	point.hydrological_region;

    document.getElementById("grid-point_reference").innerHTML =
	"<span class='text-light'>Station de référence: </span>" +
	(point.is_reference ? "Oui" : "Non");

    document.getElementById("grid-point_n").innerHTML =
	"<span class='text-light'>Nombre de modèles hydrologiques: </span>" +
	point.n;
    
    var HM = get_HM();
    var surface_HM = HM.map(hm => "surface_" +
			    hm.toLowerCase().replace('-', '_') +
			    "_km2");
    surface_HM = surface_HM.map(x => point[x]);
    var isnotNull = surface_HM.map(value => value !== null);
    HM = HM.filter((_, index) => isnotNull[index]);

    HM_available =
	HM.reduce((str, hm) => str + `${hm}&nbsp; `, "");
    document.getElementById("grid-point_HM").innerHTML = HM_available;
    
    document.getElementById("grid-point_xl93").innerHTML =
	"<span class='text-light'>XL93: </span>" +
	Math.round(point.xl93_m) +
	" <span class='text-light'>m</span>";
    document.getElementById("grid-point_yl93").innerHTML =	
	"<span class='text-light'>YL93: </span>" + 
	Math.round(point.yl93_m) +
	" <span class='text-light'>m</span>";

    // document.getElementById("grid-point_lat").innerHTML =
    //     "<span class='text-light'>lat: </span>" +
    //     Math.abs(point.lat_deg.toFixed(2)) +
    //     " <span class='text-light'>°</span>" + (point.lat_deg >= 0 ? "N" : "S");
    // document.getElementById("grid-point_lon").innerHTML =	
    //     "<span class='text-light'>lon: </span>" + 
    //     Math.abs(point.lon_deg.toFixed(2)) +
    //     " <span class='text-light'>°</span>" + (point.lon_deg >= 0 ? "E" : "W") ;

    document.getElementById("grid-point_surface").innerHTML =
	"<span class='text-light'>Surface: </span>" +
	Math.round(point.surface_km2) +
	" <span class='text-light'>km<sup>2</sup></span>";
}


let show_point = false

function redrawPoint(svgElement, data_back, projectionMap) {
    
    if (data_back) {
	svgElement.selectAll(".point").remove();
	svgElement.selectAll("circle.point")
	    .data(data_back.data)
	    .join("circle")
	    .attr("class", "point")
	    .attr("cx", function(d) {
		return projectionMap([d.lon_deg, d.lat_deg])[0];
	    })
	    .attr("cy", function(d) {
		return projectionMap([d.lon_deg, d.lat_deg])[1];
	    })
	    .attr("r", 2)
	    .attr("fill", function(d) {
		return d.fill;
	    })

	    .on("mouseover", function(event, d) {
            if (!show_point){
                if (!d3.select(this).classed("clicked")) {
                    d3.select(this).attr("stroke", "#060508").raise();
                }

                // document.getElementById("panel-hover_description").style.display = "block";
                // document.getElementById("panel-hover-content_description").innerHTML =
                //     "<span style='font-weight: 900; color:" + d.fill_text + ";'>" +
                //     d.name + "</span>";

                document.getElementById("panel-hover_code").style.display = "block";
                document.getElementById("panel-hover-content_code").innerHTML =
                    "<span style='font-weight: 900; color:" + d.fill_text + ";'>" +
                    d.code + " [" + d.value.toFixed(0) + "%] <br>"+ d.name + "</span>";
                // const value = d.value.toFixed(2);
                // document.getElementById("panel-hover-content_value").innerHTML =
                // "<span style='color:" + d.fill_text + ";'>" +
                // "<span style='font-weight: 900;'>" +
                // (value > 0 ? "+" : "") + value + " </span>%</span>";
            }
	    })
	    .on("mouseout", function(event, d) {
            if (!show_point){
                if (!d3.select(this).classed("clicked")) {
                    d3.select(this).attr("stroke", "none");
                }
                document.getElementById("panel-hover_description").style.display = "none";
                document.getElementById("panel-hover_code").style.display = "none";
            }
	    })
	    // .on("click", function(d, point) {
		// // show_serie(data_back, point.code);
        //     show_point = !show_point
        //     if (!d3.select(this).classed("clicked")) {
        //         d3.select(this).attr("stroke", "#060508").raise();
        //     }

        //     document.getElementById("panel-hover_description").style.display = "block";
        //     document.getElementById("panel-hover-content_description").innerHTML =
        //         "<span style='font-weight: 900; color:" + d.fill_text + ";'>" +
        //         d.name + "</span>";
	    // });
    }
    
    return svgElement
}





function drawSVG_for_export(id_svg, data, Height, Width, narratif_text="", narratif_color="") {
    // Select the existing SVG element
    const svgFrance = d3.select(id_svg);
    const clonedSvgFrance = svgFrance.node().cloneNode(true);
    const franceWidth = svgFrance.node().getBoundingClientRect().width;
    const franceHeight = svgFrance.node().getBoundingClientRect().height;
    // const franceAspectRatio = franceWidth / franceHeight;

    const svgColorbar = d3.select("#svg-colorbar");
    const clonedSvgColorbar = svgColorbar.node().cloneNode(true);

    const colorbarWidth = svgColorbar.node().getBoundingClientRect().width;
    const colorbarHeight = svgColorbar.node().getBoundingClientRect().height;
    const bbox = svgColorbar.node().getBBox();
    clonedSvgColorbar.setAttribute("viewBox", `${bbox.x} ${bbox.y} ${bbox.width + 10} ${bbox.height}`);
    
    const combinedSVGNode = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    const combinedSVG = d3.select(combinedSVGNode)
          .attr("width", Width)
          .attr("height", Height)
	  .attr("viewBox", `0 0 ${Width} ${Height}`)
          .attr("xmlns", "http://www.w3.org/2000/svg");

    const fontStyle = `
    @import url('https://fonts.googleapis.com/css2?family=Lato:wght@400&family=Raleway:wght@500;600;800;900&display=swap');    
`;
    combinedSVG.append("style")
	.attr("type", "text/css")
	.text(fontStyle);
    
    combinedSVG.append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", Width)
        .attr("height", Height)
        .attr("fill", "#F5F5F5");

    
    // Append France to combined SVG
    const france_scale = 1450/franceHeight;
    const france_left = 2;
    const france_top = 430;

    clonedSvgFrance.setAttribute("viewBox", `0 0 ${franceWidth} ${franceHeight}`);
    clonedSvgFrance.setAttribute("width", france_scale * franceWidth);
    clonedSvgFrance.setAttribute("height", france_scale * franceHeight);
    combinedSVG.append(() => clonedSvgFrance)
	.attr("transform", `translate(${france_left}, ${france_top})`);

    var colorbar_right;
    
    if (isMapZoomed()) {
	colorbar_right = 400;
	combinedSVG.append("rect")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", 2000)
            .attr("height", 470)
            .attr("fill", "#F5F5F5");

	combinedSVG.append("rect")
            .attr("x", 0)
            .attr("y", 1790)
            .attr("width", 2000)
            .attr("height", 290)
            .attr("fill", "#F5F5F5");

	combinedSVG.append("rect")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", 70)
            .attr("height", 2000)
            .attr("fill", "#F5F5F5");

	// combinedSVG.append("rect")
    //         .attr("x", 1620)
    //         .attr("y", 0)
    //         .attr("width", 380)
    //         .attr("height", 2000)
    //         .attr("fill", "#F5F5F5");
    } else {
	colorbar_right = 440;
    }

    const colorbar_height = 850;
    const colorbar_scale = colorbar_height/colorbarHeight;
    
    const colorbar_top = 670;
    const colorbar_width_shift = 14;
    const colorbar_height_shift = 0;

    clonedSvgColorbar.setAttribute("viewBox", `0 0 ${colorbarWidth + colorbar_width_shift} ${colorbarHeight + colorbar_height_shift}`);
    clonedSvgColorbar.setAttribute("width", colorbar_scale * colorbarWidth);
    clonedSvgColorbar.setAttribute("height", colorbar_scale * colorbarHeight);
    combinedSVG.append(() => clonedSvgColorbar)
	.attr("transform", `translate(${Width-colorbar_right}, ${colorbar_top})`);

    
    // Main title text
    var title = data.name_fr;
    const width_max_title = 42;
    let title_wrap = wrapTextByCharacterLimit(title, width_max_title);

    let title_text_shift_top;
    let title_text_add_top;
    if (title_wrap.length == 1) {
	title_text_shift_top = 20;
	title_text_add_top = 0;
    } else {
	title_text_shift_top = 0;
	title_text_add_top = 65;
    }

    // Subtitle text
    var horizon = get_horizon();
    var relatif = data.to_normalise ? "relatifs " : ""; 
    var subtitle = "Changements " + relatif + horizon.text + " par rapport à la période de référence 1991-2020";
    const width_max_subtitle = 85;
    let subtitle_wrap = wrapTextByCharacterLimit(subtitle, width_max_subtitle);

    if (subtitle_wrap.length == 1) {
	subtitle_text_shift_top = 25;
	subtitle_text_add_top = 0;
    } else {
	subtitle_text_shift_top = 0;
	subtitle_text_add_top = 50;
    }

    // Storyline subtitle
    
    var subtitle_storyline = "Narratif " + selected_storyline.narratif_id + " ("+ families[selected_storyline.famille_id] + ") : " + selected_storyline.narratif_description
    let subtitle_storyline_wrap = wrapTextByCharacterLimit(subtitle_storyline, width_max_subtitle-5);
    if (subtitle_wrap.length == 1) {
	subtitle_storyline_shift_top = 25;
	subtitle_storyline_add_top = 0;
    } else {
	subtitle_storyline_shift_top = 0;
	subtitle_storyline_add_top = 50;
    }

    // Left vertical bar
    const header_line_left1 = 64;
    const header_line_top1 = 30 + title_text_shift_top + subtitle_text_shift_top;
    const header_line_left2 = 64;
    const header_line_top2 = 180 + title_text_shift_top + title_text_add_top + subtitle_text_shift_top + subtitle_text_add_top;
    combinedSVG.append("line")
	.attr("x1", header_line_left1)
	.attr("y1", header_line_top1) 
	.attr("x2", header_line_left2)
	.attr("y2", header_line_top2) 
	.attr("stroke", "#C5E7E7") 
	.attr("stroke-width", "35px");
    
    // Text
    const title_text_left = 120;
    const title_text_top = 90 + title_text_shift_top;    
    combinedSVG.append("text")
        .attr("x", title_text_left)
        .attr("y", title_text_top)
        .attr("text-anchor", "start")
        .attr("font-size", "60px")
        .attr("font-family", "Raleway, sans-serif")
        .attr("font-weight", "800")
        .attr("fill", "#16171f") 
        .selectAll("tspan")
        .data(title_wrap)
        .enter().append("tspan")
        .attr("x", title_text_left)
        .attr("dy", (d, i) => i === 0 ? 0 : "1.1em")
        .text(d => d);

    // SUBTITLE  
    const subtitle_text_left = 120;
    const subtitle_text_top = 160 + title_text_shift_top + title_text_add_top;
    combinedSVG.append("text")
        .attr("x", subtitle_text_left)
        .attr("y", subtitle_text_top)
        .attr("text-anchor", "start")
        .attr("font-size", "50px")
        .attr("font-family", "Lato, sans-serif")
        .attr("font-weight", "400")
        .attr("fill", "#16171f")
        .selectAll("tspan")
        .data(subtitle_wrap)
        .enter().append("tspan")
        .attr("x", subtitle_text_left)
        .attr("dy", (d, i) => i === 0 ? 0 : "1.1em")
        .text(d => d);

    // Selected storyline information
    const subtitle_storyline_text_left = 50;
    const subtitle_storyline_text_top = 230 + title_text_shift_top + title_text_add_top + subtitle_text_shift_top + subtitle_text_add_top;

    const bar_width = 80;
    const bar_height = 12; 
    const bar_radius = 4;

    combinedSVG.append("rect")
        .attr("x", subtitle_storyline_text_left)
        .attr("y", subtitle_storyline_text_top - 22)
        .attr("width", bar_width)
        .attr("height", bar_height)
        .attr("rx", bar_radius)  // Rayon horizontal pour coins arrondis
        .attr("ry", bar_radius)  // Rayon vertical pour coins arrondis
        .attr("fill", selected_storyline.narratif_couleur); // Couleur (à adapter)

    combinedSVG.append("text")
        .attr("x", subtitle_storyline_text_left)
        .attr("y", subtitle_storyline_text_top)
        .attr("text-anchor", "start")
        .attr("font-size", "50px")
        .attr("font-family", "Lato, sans-serif")
        .attr("font-weight", "600")
        .attr("fill", selected_storyline.narratif_couleur)
        .selectAll("tspan")
        .data(subtitle_storyline_wrap)
        .enter().append("tspan")
        // .attr("x", subtitle_storyline_text_left)
        .attr("x", (d, i) => i === 0 ? subtitle_storyline_text_left+100 : subtitle_storyline_text_left)
        .attr("dy", (d, i) => i === 0 ? 0 : "1.1em")
        .text(d => d);

    // Selected chain information
    var subtitle_chain = "GCM : " + selected_storyline.gcm + ", RCM : " + selected_storyline.rcm + ", BC : " + selected_storyline.bc + ", HM : " + selected_storyline.hm
    
    let subtitle_chain_wrap = wrapTextByCharacterLimit(subtitle_chain, width_max_subtitle);
    const subtitle_chain_text_left = 50;
    const subtitle_chain_text_top = 300 + title_text_shift_top + title_text_add_top + subtitle_text_shift_top + subtitle_text_add_top + subtitle_storyline_shift_top + subtitle_storyline_add_top;
    combinedSVG.append("text")
        .attr("x", subtitle_chain_text_left)
        .attr("y", subtitle_chain_text_top)
        .attr("text-anchor", "start")
        .attr("font-size", "40px")
	.attr("font-family", "Lato, sans-serif")
	.attr("font-weight", "400")
        .attr("fill", "#89898A")
        .selectAll("tspan")
        .data(subtitle_chain_wrap)
        .enter().append("tspan")
        .attr("x", subtitle_chain_text_left)
        .attr("dy", (d, i) => i === 0 ? 0 : "1.1em")
        .text(d => d);

    
    let top_text = "";
    let top_text_color = "transparent";

    let width_max_chain_text = 90;
    let chain_text_shift = 80;
    let chain_text;
    var projection = get_projection();
    var n = default_n;
    // if (drawer_mode === 'drawer-narratif') {
	chain_text = "Changements " + relatif + horizon.text + " par rapport à la période de référence 1991-2020 sous le";
	top_text = narratif_text;
	top_text_color = narratif_color;

    const RCP_text = projection.RCP;
    const model_text = "avec au moins " + n + " modèles hydrologiques par point";
    chain_text = chain_text + " " + RCP_text + " " + model_text;

    const width_max_top_text = 100;
    const top_text_wrap = wrapTextByCharacterLimit(top_text, width_max_top_text);
    // const top_text_right = 800;
    const top_text_right = 200;
    const top_text_top = 450;
    combinedSVG.append("text")
        .attr("x", top_text_right - chain_text_shift)
        .attr("y", top_text_top)
        .attr("text-anchor", "end")
        .attr("font-size", "40px")
	.attr("font-family", "Raleway, sans-serif")
	.attr("font-weight", "600")
        .attr("fill", top_text_color)
        .selectAll("tspan")
        .data(top_text_wrap)
        .enter().append("tspan")
        .attr("x", top_text_right)
        .attr("dy", (d, i) => i === 0 ? 0 : "1.1em")
        .text(d => d);

    const top_line_right1 = 115;
    const top_line_top1 = 412;
    const top_line_right2 = 115;
    const top_line_top2 = 412 + 45*top_text_wrap.length; //548
    combinedSVG.append("line")
	.attr("x1", Width - top_line_right1)
	.attr("y1", top_line_top1) 
	.attr("x2", Width - top_line_right2)
	.attr("y2", top_line_top2) 
	.attr("stroke", top_text_color)
	.attr("stroke-width", "6px");
    
    // Grey i for information
    const i_text_left = 140 - chain_text_shift;
    const i_text_bottom = 150;
    combinedSVG.append("text")
        .attr("x", i_text_left)
        .attr("y", Height - i_text_bottom)
        .attr("text-anchor", "middle")
        .attr("font-size", "40px")
	.attr("font-family", "Georgia, serif")
        .attr("font-weight", "600")
	.attr("fill", "#89898A")
        .text("i");

    // Grey circle around i
    const circle_left = 140 - chain_text_shift;
    const circle_bottom = 165;
    const circle_radius = 22;
    combinedSVG.append("circle")
	.attr("cx", circle_left)
	.attr("cy", Height - circle_bottom)
	.attr("r", circle_radius)
	.attr("fill", "transparent")
	.attr("stroke", "#89898A")
	.attr("stroke-width", "5px");
    
    // Grey commentary on data
    const chain_text_wrap = wrapTextByCharacterLimit(chain_text, width_max_chain_text);
    const chain_text_left = 120;
    const chain_text_bottom = 150;
    combinedSVG.append("text")
        .attr("x", chain_text_left)
        .attr("y", Height - chain_text_bottom)
        .attr("text-anchor", "start")
        .attr("font-size", "35px")
	.attr("font-family", "Raleway, sans-serif")
	.attr("font-weight", "500")
        .attr("fill", "#89898A")
        .selectAll("tspan")
        .data(chain_text_wrap)
        .enter().append("tspan")
        .attr("x", chain_text_left)
        .attr("dy", (d, i) => i === 0 ? 0 : "1.1em")
        .text(d => d);
    

    // Meandre-Tracc name on bottom left
    const meandre_text_left = 240;
    const meandre_text_bottom = 50;
    combinedSVG.append("text")
        .attr("x", meandre_text_left)
        .attr("y", Height - meandre_text_bottom)
        .attr("text-anchor", "start")
        .attr("font-size", "65px")
	.attr("font-family", "Raleway, sans-serif")
        .attr("font-weight", "900")
	.attr("fill", "#16171f")
        .text("MEANDRE-TRACC");

    // url below meandre-tracc
    const url_text_left = 246;
    const url_text_bottom = 25;
    combinedSVG.append("text")
        .attr("x", url_text_left)
        .attr("y", Height - url_text_bottom)
        .attr("text-anchor", "start")
        .attr("font-size", "25px")
	.attr("font-family", "Raleway, sans-serif")
        .attr("font-weight", "500")
	.attr("fill", "#16171f")
        .text("meandre-tracc.explore2.inrae.fr");

    // Separator 
    const footer_line_left1 = 880;
    const footer_line_bottom1 = 100;
    const footer_line_left2 = 880;
    const footer_line_bottom2 = 20;
    combinedSVG.append("line")
	.attr("x1", footer_line_left1)
	.attr("y1", Height - footer_line_bottom1) 
	.attr("x2", footer_line_left2)
	.attr("y2", Height - footer_line_bottom2) 
	.attr("stroke", "#C5E7E7")
	.attr("stroke-width", "10px");

    const footer_text_left = 900;
    const footer_text_bottom = 80;
    combinedSVG.append("text")
        .attr("x", footer_text_left)
        .attr("y", Height - footer_text_bottom)
        .attr("text-anchor", "start")
        .attr("font-size", "20px")
	.attr("font-family", "Lato, sans-serif")
	.attr("font-weight", "400")
        .attr("fill", "#060508")
        .selectAll("tspan")
        .data([
	    "Ces résultats sont issus de projections hydrologiques réalisées sur la France. La mise à jour",
	    "de ces projections a été réalisé entre 2022 et 2025 dans le cadre du projet national Explore2.",
	    "Ces résultats sont un aperçu de quelques futurs possibles pour la ressource en eau."
        ])
        .enter().append("tspan")
        .attr("x", footer_text_left)
        .attr("dy", (d, i) => i === 0 ? 0 : "1.1em")
        .text(d => d);
    
    
    const lo_text_right = 140;
    const lo_text_bottom = 70;
    combinedSVG.append("text")
        .attr("x", Width - lo_text_right)
        .attr("y", Height - lo_text_bottom)
        .attr("text-anchor", "start")
        .attr("font-size", "30px")
	.attr("font-family", "Arial, sans-serif")
	.attr("font-weight", "300")
        .attr("fill", "#89898A")
        .selectAll("tspan")
        .data([
	    "Licence",
	    "Ouverte"
        ])
        .enter().append("tspan")
        .attr("x", Width - lo_text_right)
        .attr("dy", (d, i) => i === 0 ? 0 : "1.1em")  // Adjust vertical spacing between lines
        .text(d => d);

    return combinedSVG;
}


function convertSVGToPNG(svgSelector, data, filename, zip, Height, Width, narratif="", color="") {
    return new Promise((resolve) => {
        const combinedSVG = drawSVG_for_export(svgSelector, data, Height, Width, narratif, color);

        // Fetch the first logo (MEANDRE)
        fetch('/resources/logo/MEANDRE/MEANDRE-TRACC_logo.svg')
            .then(response => response.text())
            .then(svgData => {
                const base64Logo1 = btoa(svgData);
                combinedSVG.append("image")
                    .attr("href", "data:image/svg+xml;base64," + base64Logo1)
                    .attr("x", 45)
                    .attr("y", Height - 120)
                    .attr("width", 160)
                    .attr("preserveAspectRatio", "xMidYMid meet");

                // Fetch the second logo
                return fetch('/resources/licence_ouverte/Logo-licence-ouverte2_grey.svg');
            })
            .then(response => response.text())
            .then(svgData2 => {
                const base64Logo2 = btoa(svgData2);
                combinedSVG.append("image")
                    .attr("href", "data:image/svg+xml;base64," + base64Logo2)
                    .attr("x", Width - 225)
                    .attr("y", Height - 110)
                    .attr("height", 90)
                    .attr("preserveAspectRatio", "xMidYMid meet");

                // Convert SVG to PNG
                const combinedSVGNode = combinedSVG.node();
                const svgString = new XMLSerializer().serializeToString(combinedSVGNode);
                const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
                const img = new Image();
                const svgUrl = URL.createObjectURL(svgBlob);

                img.onload = function () {
                    const canvas = document.createElement("canvas");
                    canvas.width = Width;
                    canvas.height = Height;
                    const ctx = canvas.getContext("2d");
                    ctx.drawImage(img, 0, 0);
                    
                    // Convert to PNG and add to ZIP
                    canvas.toBlob((pngBlob) => {
                        zip.file(`${filename}.png`, pngBlob);
                        resolve();
                    }, "image/png");
                };

                img.src = svgUrl;
                combinedSVG.remove();
            });
    });
}


function wrapTextByCharacterLimit(text, maxChars) {
    let words = text.split(' '); // Split the text into words
    let lines = [];
    let currentLine = [];

    words.forEach(word => {
        let currentLineLength = currentLine.join(' ').length;

        // If the word fits within the max limit, add it to the current line
        if (currentLineLength + word.length + 1 <= maxChars) {
            currentLine.push(word);
        } else {
            // If the line reaches the limit, push it to lines and start a new line
            lines.push(currentLine.join(' '));
            currentLine = [word];
        }
    });

    // Add the last line if there are remaining words
    if (currentLine.length > 0) {
        lines.push(currentLine.join(' '));
    }

    return lines;
}


async function get_files () {
    // data meta_point
    const csvData_data = [];
    const csvData_meta_point = [];

    data_point_QA.data.forEach(item => {
	csvData_data.push({
            code: item.code,
            fill: item.fill
	});

	const { fill, fill_text, value, ...otherFields } = item;
	csvData_meta_point.push(otherFields);
    });
    let fieldOrder
    
    fieldOrder = [
	"code",
	"code_hydro2",
	"is_reference",
	"name",
	"hydrological_region",
	"lat_deg",
	"lon_deg",
	"xl93_m",
	"yl93_m",
	"n_rcp26",
	"n_rcp45",
	"n_rcp85",
	"surface_km2",
	"surface_ctrip_km2",
	"surface_eros_km2",
	"surface_grsd_km2",
	"surface_j2000_km2",	    
	"surface_mordor_sd_km2",
	"surface_mordor_ts_km2",
	"surface_orchidee_km2",
	"surface_sim2_km2",
	"surface_smash_km2"
    ];
    const csv_meta_point = Papa.unparse(csvData_meta_point, {
        columns: fieldOrder
    });

    // meta_variable
    const csvData_meta_variable = [];
    // Fonction pour extraire les métadonnées d'une source
    function extractMetadata(dataSource) {
        const row = {};
        Object.entries(dataSource).forEach(([key, value]) => {
            if (key === 'data') {
            return;
            }
            if (Array.isArray(value)) {
            row[key] = value.join(", ");
            } else {
            row[key] = value;
            }
        });
        return row;
    }

    // Récupérer les métadonnées pour les 3 sources
    csvData_meta_variable.push(extractMetadata(data_point_QA));
    csvData_meta_variable.push(extractMetadata(data_point_QJXA));
    csvData_meta_variable.push(extractMetadata(data_point_VCN10));

    fieldOrder = [
    "variable_en",
    "unit_en",
    "name_en",
    "description_en",
    "method_en",
    "sampling_period_en",
    "topic_en",
    "variable_fr",
    "unit_fr",
    "name_fr",
    "description_fr",
    "method_fr",
    "sampling_period_fr",
    "topic_fr",
    "is_date",
    "to_normalise",
    "palette",
    "bin"
    ];

    const csv_meta_variable = Papa.unparse(csvData_meta_variable, {
    columns: fieldOrder
    });

    // meta projection
    const csvData_meta_projection = [];
    const row = {
	    chain: selected_storyline.chain,
	    RCP: "historical-rcp"+RCP_value ,
	    GCM: selected_storyline.gcm,
	    RCM: selected_storyline.rcm,
	    BC: selected_storyline.bc,
	    HM: selected_storyline.hm,
	    storyline_name: selected_storyline.narratif_id,
	    storyline_info: selected_storyline.narratif_description,
	    storyline_color: selected_storyline.narratif_couleur
        };
    csvData_meta_projection.push(row);
    const csv_meta_projection = Papa.unparse(csvData_meta_projection, {
        columns: ["chain", "RCP", "GCM", "RCM", "BC", "HM",
		  "storyline_name", "storyline_info", "storyline_color"]
    });


    const files = {
	"meta_point.csv": csv_meta_point,
    "meta_variable.csv": csv_meta_variable,
    "meta_projection.csv": csv_meta_projection
    };

    return files;
}

async function exportDataToCSV() {

    // Créer un Map avec les codes comme clé pour fusionner les données
    const mergedData = new Map();

    // Ajouter les données QA
    data_point_QA.data.forEach(item => {
        if (!mergedData.has(item.code)) {
            mergedData.set(item.code, { code: item.code });
        }
        mergedData.get(item.code).value_QA = item.value;
        mergedData.get(item.code).fill_QA = item.fill;
    });

    // Ajouter les données QJXA
    data_point_QJXA.data.forEach(item => {
        if (!mergedData.has(item.code)) {
            mergedData.set(item.code, { code: item.code });
        }
        mergedData.get(item.code).value_QJXA = item.value;
        mergedData.get(item.code).fill_QJXA = item.fill;
    });

    // Ajouter les données VCN10
    data_point_VCN10.data.forEach(item => {
        if (!mergedData.has(item.code)) {
            mergedData.set(item.code, { code: item.code });
        }
        mergedData.get(item.code).value_VCN10 = item.value;
        mergedData.get(item.code).fill_VCN10 = item.fill;
    });

    // Convertir en tableau et créer le CSV
    const rows = Array.from(mergedData.values());
    
    // En-têtes
    const headers = ['code', 'value_QA', 'fill_QA', 'value_QJXA', 'fill_QJXA', 'value_VCN10', 'fill_VCN10'];
    let csv = headers.join(',') + '\n';

    // data.data.forEach(item => {
	// csvData_data.push({
    //         code: item.code,
    //         [variable]: item.value,
    //         fill: item.fill
	// });

    // Ajouter les lignes (gérer les virgules dans les valeurs)
    rows.forEach(row => {
        const values = headers.map(header => {
            const value = row[header] ?? '';
            // Échapper les valeurs contenant des virgules, guillemets ou retours à la ligne
            if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
                return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
        });
        csv += values.join(',') + '\n';
    });

    return csv
}

function getFormattedDateTime() {
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const day = String(currentDate.getDate()).padStart(2, '0');
    const hours = String(currentDate.getHours()).padStart(2, '0');
    const minutes = String(currentDate.getMinutes()).padStart(2, '0');
    const seconds = String(currentDate.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

async function exportData() {
    const extended_name = selected_storyline.gwl+"+n-4+region-"+selected_storyline.region_id+"+"+selected_storyline.narratif_id
    let zip;  
    zip = new JSZip();
    
    // data
    csv = exportDataToCSV();
    zip.file("data_"+extended_name+".csv", csv)

    // meta
    files = await get_files();
    Object.entries(files).forEach(([key, data_csv]) => {
        // Ajouter chaque fichier CSV au zip
        zip.file(key, data_csv);
    });

    // figures
    const Height = 2000;
    const Width = 2000;  
    
    await convertSVGToPNG("#svg-france-QA", data_point_QA, "map_QA", zip, Height, Width);
    await convertSVGToPNG("#svg-france-QJXA", data_point_QJXA, "map_QJXA", zip, Height, Width);
    await convertSVGToPNG("#svg-france-VCN10", data_point_VCN10, "map_VCN10_summer", zip, Height, Width);

    // licence fr
    const pdfResponse_LO_fr = await fetch('/resources/licence_ouverte/ETALAB-Licence-Ouverte-v2.0.pdf');
    const pdf_LO_fr = await pdfResponse_LO_fr.blob();
    // licence en
    const pdfResponse_LO_en = await fetch('/resources/licence_ouverte/ETALAB-Open-Licence-v2.0.pdf');
    const pdf_LO_en = await pdfResponse_LO_en.blob();
    zip.file("ETALAB-Licence-Ouverte-v2.0.pdf", pdf_LO_fr);
    zip.file("ETALAB-Open-Licence-v2.0.pdf", pdf_LO_en);

    // README
    let README = await fetch('/resources/README.txt');
    README = await README.text();
    var time = getFormattedDateTime();
    var horizon = get_horizon();
    var n = get_n()
    var subtitle = "Changements relatifs " + horizon.text + " par rapport à la période de référence 1991-2020";
    let param =
        "Titre : " + subtitle + "\n" +
        // "Sous-titre : " + subtitle + "\n\n" +
        "Variable : QA, QJXA et VCN10_summer \n" +
        "Unité : %\n" +
        "Horizon : " + horizon.H + "\n" +
        "Nombre de point : Il y a au moins " + n + " modèles hydrologiques par point\n" +
        "Scénario d'émission : rcp" + RCP_value + "\n" +
        "Narratif : " + selected_storyline.narratif_id + "\n" +
        "Description : " + selected_storyline.narratif + "\n" +
        "Chaîne de modélisation : " + selected_storyline.chain + "\n\n";

        README_tmp = README
            .replace(/\[DATE\]/g, time)
            .replace(/\[PARAM\]/g, param);
        zip.file("README.txt", README_tmp);

    zip.generateAsync({ type: "blob" })
        .then(function (content) {
            const link = document.createElement("a");
            link.href = URL.createObjectURL(content);
            link.download = "MEANDRE-TRACC-export+"+extended_name+".zip";
            link.click();
        });

    // var n = get_n();
    // // var variable = get_variable();
    // var projection = get_projection();
    // var horizon = get_horizon();

    // var title = data_point.name_fr;
    // var relatif = data_point.to_normalise ? "relatifs " : "";
    // var subtitle = "Changements " + relatif + horizon.text +
    //     "\n             par rapport à la période de référence 1991-2020";

    // var filename =
    //     "MEANDRE-export+" +
    //     "var-" + variable + "+" +
    //     "H-" + horizon.period.replace(/ - /g, '_') + "+" +
    //     "n-" + n + "+" +
    //     "chain-" + slugify(projection.type) +
    //     ".zip";
    
    // // let data_point_QA;
    // // let data_point_QJXA;
    // // let data_point_VCN10;
    // // let data_serie;

    // // let svgFrance_region;
    // // let svgFrance_QA;
    // // let svgFrance_QJXA;
    // // let svgFrance_VCN10;

    // let chain_info;
    // // if (drawer_mode === 'drawer-RCP') {
    // //     chain_info = "Moyenne multi-modèles par niveau d'émissions.\n";
    // //     if (projection.RCP === "RCP 2.6") {
    // //         chain_info = chain_info + "Le RCP 2.6 est un scénario compatible avec les objectifs\ndes accords de Paris.";
    // //     } else if (projection.RCP === "RCP 4.5") {
    // //         chain_info = chain_info + "Le RCP 4.5 est un scénario où des efforts modérés sont fait pour\nréduire les émissions.";
    // //     } else if (projection.RCP === "RCP 8.5") {
    // //         chain_info = chain_info + "Le RCP 8.5 est un scénario où l'augmentation des émissions\ncontinue selon la tendance actuelle.";
    // //     }
    // // } else if (drawer_mode === 'drawer-chain') {
    // //     chain_info = "Attention : Chaînes de modélisation spécifiques, l'approche\n" +
    // //         "multi-modèle doit être privilégiée. Le détail des chaînes de\n" +
    // //         "modélisation sélectionnées est disponible dans le fichier\n" +
    // //         "meta_projection.csv"
    // // }

    // // README
    // let README = await fetch('/resources/README.txt');
    // README = await README.text();
    // var time = getFormattedDateTime();
    // let param =
    //     "Titre : " + title + "\n" +
    //     "Sous-titre : " + subtitle + "\n\n" +
    //     "Variable : " + variable + "\n" +
    //     "Unité : " + data_point.unit_fr + "\n" +
    //     "Horizon : " + horizon.period + "\n" +
    //     "Nombre de point : Il y a au moins " + n + " modèles hydrologiques par point\n" +
    //     "Scénario d'émission : " + projection.RCP + "\n" +
    //     "Chaînes de modélisations : " + projection.type + "\n\n";

    // // licence fr
    // const pdfResponse_LO_fr = await fetch('/resources/licence_ouverte/ETALAB-Licence-Ouverte-v2.0.pdf');
    // const pdf_LO_fr = await pdfResponse_LO_fr.blob();
    // // licence en
    // const pdfResponse_LO_en = await fetch('/resources/licence_ouverte/ETALAB-Open-Licence-v2.0.pdf');
    // const pdf_LO_en = await pdfResponse_LO_en.blob();

    // // figure
    // const Height = 2000;
    // const Width = 2000;

    // let zip;

    // const data_point_storyline = {
    //     "QA": data_point_QA,
    //     "QJXA": data_point_QJXA,
    //     "VCN10": data_point_VCN10,
    // }
    
    // zip = new JSZip();
    // for (const storyline of Object.keys(data_point_storyline)) {
    //     const folder = zip.folder(storyline);
    //     const files = get_files(data_point_storyline[storyline],
    //         variable,
    //         projection["chain_" + storyline]);
    //     for (const [fileName, content] of Object.entries(files)) {
    //         folder.file(fileName, content);
    //     }

    //     var param_tmp = param + Storylines_map[storyline].info_readme;
    //     README_tmp = README
    //         .replace(/\[DATE\]/g, time)
    //         .replace(/\[PARAM\]/g, param_tmp);
    //     folder.file("README.txt", README_tmp);

    //     folder.file("ETALAB-Licence-Ouverte-v2.0.pdf", pdf_LO_fr);
    //     folder.file("ETALAB-Open-Licence-v2.0.pdf", pdf_LO_en);

    //     // Await the PNG conversion
    //     await convertSVGToPNG("#svg-france-" + storyline, "map-" + storyline,
    //         folder, Height, Width,
    //         Storylines_map[storyline].info,
    //         Storylines_map[storyline].color);
    // }

    // // } else {
    // //     zip = new JSZip();
    // //     const files = get_files(data_point, variable,
    // //         projection.chain);
    // //     for (const [fileName, content] of Object.entries(files)) {
    // //         zip.file(fileName, content);
    // //     }

    // //     var param_tmp = param + chain_info;
    // //     README_tmp = README
    // //         .replace(/\[DATE\]/g, time)
    // //         .replace(/\[PARAM\]/g, param_tmp);
    // //     zip.file("README.txt", README_tmp);

    // //     zip.file("ETALAB-Licence-Ouverte-v2.0.pdf", pdf_LO_fr);
    // //     zip.file("ETALAB-Open-Licence-v2.0.pdf", pdf_LO_en);

    // //     // Await the PNG conversion
    // //     await convertSVGToPNG("#svg-france", "map", zip, Height, Width);
    // // }

    // zip.generateAsync({ type: "blob" })
    //     .then(function (content) {
    //         const link = document.createElement("a");
    //         link.href = URL.createObjectURL(content);
    //         link.download = filename;
    //         link.click();
    //     });
}
