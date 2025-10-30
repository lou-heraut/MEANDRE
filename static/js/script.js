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
    api_base_url = "https://meandre.explore2.inrae.fr";
    default_n = 4;
} else {
    api_base_url = "http://127.0.0.1:5000";
    default_n = 7;
}



let geoJSONdata_france, geoJSONdata_basinHydro, geoJSONdata_river;//, geoJSONdata_entiteHydro;

const geoJSONfiles = [
    "/data/france.geo.json",
    "/data/basinHydro.geo.json",
    "/data/river.geo.json"
    // "/data/entityHydro.geo.json"
];


let URL_QA = ["/",
	      "/plus-d-eau-ou-moins-d-eau/nord-et-sud",
	      "/plus-d-eau-ou-moins-d-eau/et-entre-les-deux",
	      "/plus-d-eau-ou-moins-d-eau/le-changement-dans-la-continuite",
	      "/plus-d-eau-ou-moins-d-eau/ajouter-une-pincee-de-variabilite-naturelle",
	      "/plus-d-eau-ou-moins-d-eau/raconter-les-trajectoires"];

let URL_VCN10 = ["/des-etiages-plus-severe/moins-d-eau-l-ete",
		 "/des-etiages-plus-severe/et-c-est-certain"];

let URL_dtLF = ["/des-etiages-plus-severe/des-etiages-plus-longs"];

let URL_QJXA = ["/des-crues-incertaines/quelle-evolution-en-france",
		"/des-crues-incertaines/et-d-abord-dans-quelle-direction",
		"/des-crues-incertaines/ajouter-une-louche-de-variabilite"];

let URL_narratifs = ["/plus-d-eau-ou-moins-d-eau/et-entre-les-deux",
		     "/plus-d-eau-ou-moins-d-eau/raconter-les-trajectoires",
		     "/des-etiages-plus-severe/et-c-est-certain",
		     "/des-etiages-plus-severe/des-etiages-plus-longs",
		     "/des-crues-incertaines/et-d-abord-dans-quelle-direction"]; 

let URL_serie = ["/plus-d-eau-ou-moins-d-eau/ajouter-une-pincee-de-variabilite-naturelle",
		 "/plus-d-eau-ou-moins-d-eau/raconter-les-trajectoires",
		 "/des-etiages-plus-severe/des-etiages-plus-longs",
		 "/des-crues-incertaines/ajouter-une-louche-de-variabilite"];

let URL_noSL = ["/",
		"/plus-d-eau-ou-moins-d-eau/nord-et-sud",
		"/plus-d-eau-ou-moins-d-eau/et-entre-les-deux",
		"/plus-d-eau-ou-moins-d-eau/le-changement-dans-la-continuite",
		"/plus-d-eau-ou-moins-d-eau/ajouter-une-pincee-de-variabilite-naturelle"]; 


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


function loadGeoJSON(fileURL) {
    return d3.json(fileURL)
	.then(data => data)
	.catch(error => {
	    console.error("Error loading geojson file :", error);
	    throw error;
	});
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
		if (drawer_mode === 'drawer-narratif') {
		    svgFrance_vert = update_map("#svg-france-vert", svgFrance, data_point=null);
		    svgFrance_jaune = update_map("#svg-france-jaune", svgFrance, data_point=null);
		    svgFrance_orange = update_map("#svg-france-orange", svgFrance, data_point=null);
		    svgFrance_violet = update_map("#svg-france-violet", svgFrance, data_point=null);
		} else {
		    svgFrance = update_map("#svg-france", svgFrance, data_point=null);
		}
	    });
    }

    if (url !== "/a-propos") {
	if (start && url == "/") {
	    $("#container-map-gallery").load("/html" + "/plus-d-eau-ou-moins-d-eau/nord-et-sud" + ".html", function() {
		check_url();
	    });
	    update_data_point_debounce();
	    
	} else if (actualise && url !== "/") {
	    $("#container-map-gallery").load("/html" + url + ".html", function() {
		check_url();
	    });
	    update_data_point_debounce();
	}
	
    } else {
	$("#container-map-gallery").load("/html" + url + ".html");
    }
}


function check_url() {
    var url = window.location.pathname;
    var selected_variable = get_variable();

    // console.log(selected_variable);
    
    if (URL_QA.includes(url) && selected_variable != "QA") {
	var variable = document.getElementById("button-QA");
	selectVariableButton(variable);

    } else if (URL_VCN10.includes(url) && selected_variable != "VCN10_summer") {
	var variable = document.getElementById("button-VCN10_summer");
	selectVariableButton(variable);
	
    } else if (URL_dtLF.includes(url) && selected_variable != "dtLF_summer") {
	var variable = document.getElementById("button-dtLF_summer");
	selectVariableButton(variable);
	
    } else if (URL_QJXA.includes(url) && selected_variable != "QJXA") {
	var variable = document.getElementById("button-QJXA");
	selectVariableButton(variable);
    }

    if (URL_narratifs.includes(url)) {
	change_drawer("drawer-narratif");
    } else {
	change_drawer("drawer-chain");
    }
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
let data_point_vert;
let data_point_jaune;
let data_point_orange;
let data_point_violet;
let data_serie;

let svgFrance;
let svgFrance_vert;
let svgFrance_jaune;
let svgFrance_orange;
let svgFrance_violet;

function update_data_point() {

    var url = window.location.pathname;
    let check_cache;
    if (url === "/exploration-avancee") {
	check_cache = false; 
    } else {
	check_cache = true;
    }
    
    if (drawer_mode === 'drawer-narratif') {
	$('#map-vert-loading').css('display', 'flex');
	$('#map-jaune-loading').css('display', 'flex');
	$('#map-orange-loading').css('display', 'flex');
	$('#map-violet-loading').css('display', 'flex');
    } else {
	$('#map-loading').css('display', 'flex');	
    }
    
    var n = get_n();
    var variable = get_variable();
    var horizon = get_horizon();
    var projection = get_projection();
    
    if (drawer_mode === 'drawer-narratif') {
	var data_query = {
	    n: n,
            exp: projection.exp,
            chain: projection.chain,
            variable: variable,
            horizon: horizon.H,
	    check_cache: check_cache,
	};
	fetch(api_base_url + "/get_delta_on_horizon", {
            method: 'POST',
            headers: {
		'Content-Type': 'application/json'
            },
            body: JSON.stringify(data_query)
	})
	    .then(response => response.json())
	    .then(data_back => {
		data_point = data_back;
		update_grid(data_back);
		draw_colorbar(data_back);
		check_url_after_data();
	    })

	var data_query = {
	    n: n,
            exp: projection.exp,
            chain: projection.chain_vert,
            variable: variable,
            horizon: horizon.H,
	    check_cache: check_cache,
	};
	fetch(api_base_url + "/get_delta_on_horizon", {
            method: 'POST',
            headers: {
		'Content-Type': 'application/json'
            },
            body: JSON.stringify(data_query)
	})
	    .then(response => response.json())
	    .then(data_back => {
		data_point_vert = data_back;
		svgFrance_vert = update_map("#svg-france-vert", svgFrance_vert, data_point_vert);
		$('#map-vert-loading').css('display', 'none');
	    })

	var data_query = {
	    n: n,
            exp: projection.exp,
            chain: projection.chain_jaune,
            variable: variable,
            horizon: horizon.H,
	    check_cache: check_cache,
	};
	fetch(api_base_url + "/get_delta_on_horizon", {
            method: 'POST',
            headers: {
		'Content-Type': 'application/json'
            },
            body: JSON.stringify(data_query)
	})
	    .then(response => response.json())
	    .then(data_back => {
		data_point_jaune = data_back;
		svgFrance_jaune = update_map("#svg-france-jaune", svgFrance_jaune, data_point_jaune);
		$('#map-jaune-loading').css('display', 'none');
	    })

	var data_query = {
	    n: n,
            exp: projection.exp,
            chain: projection.chain_orange,
            variable: variable,
            horizon: horizon.H,
	    check_cache: check_cache,
	};
	fetch(api_base_url + "/get_delta_on_horizon", {
            method: 'POST',
            headers: {
		'Content-Type': 'application/json'
            },
            body: JSON.stringify(data_query)
	})
	    .then(response => response.json())
	    .then(data_back => {
		data_point_orange = data_back;
		svgFrance_orange = update_map("#svg-france-orange", svgFrance_orange, data_point_orange);
		$('#map-orange-loading').css('display', 'none');
	    })

	var data_query = {
	    n: n,
            exp: projection.exp,
            chain: projection.chain_violet,
            variable: variable,
            horizon: horizon.H,
	    check_cache: check_cache,
	};
	fetch(api_base_url + "/get_delta_on_horizon", {
            method: 'POST',
            headers: {
		'Content-Type': 'application/json'
            },
            body: JSON.stringify(data_query)
	})
	    .then(response => response.json())
	    .then(data_back => {
		data_point_violet = data_back;
		svgFrance_violet = update_map("#svg-france-violet", svgFrance_violet, data_point_violet);
		$('#map-violet-loading').css('display', 'none');
	    })
	
	
    } else {
	var data_query = {
	    n: n,
            exp: projection.exp,
            chain: projection.chain,
            variable: variable,
            horizon: horizon.H,
	    check_cache: check_cache,
	};

	fetch(api_base_url + "/get_delta_on_horizon", {
            method: 'POST',
            headers: {
		'Content-Type': 'application/json'
            },
            body: JSON.stringify(data_query)
	})
	    .then(response => response.json())
	    .then(data_back => {
		data_point = data_back;
		// delete data_back.data;
		// meta_point = data_back;
		update_grid(data_back);
		draw_colorbar(data_back);
		svgFrance = update_map("#svg-france", svgFrance, data_point);
		svgFrance = redrawPoint(svgFrance, data_point);
		$('#map-loading').css('display', 'none');
		check_url_after_data();
	    })
    }
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


window.addEventListener('resize', function() {
    plot_data_serie();
});

function plot_data_serie() {
    if (data_serie) {
	var url = window.location.pathname;
	if (URL_noSL.includes(url)) {
	    data_serie = data_serie.filter(item => item.order === 0);
	}
	
	d3.select("#svg-line").selectAll("*").remove();
	var svgContainer = d3.select("#svg-line");

	var svgNode = d3.select("#grid-line").node();
	var computedStyle = window.getComputedStyle(svgNode);
	var paddingLeft = parseFloat(computedStyle.paddingLeft);
	var paddingRight = parseFloat(computedStyle.paddingRight);
	var containerPadding = paddingLeft + paddingRight;
	var svgWidth = svgNode.getBoundingClientRect().width - containerPadding;
	
	var svgHeight_min = 250;
	var svgHeight = Math.max(svgHeight_min,
				 +svgContainer.node().getBoundingClientRect().height);
	
	var margin = { top: 10, right: 10, bottom: 20, left: 40 };
	var width = svgWidth - margin.left - margin.right;
	var height = svgHeight - margin.top - margin.bottom;

	var svg = svgContainer
	    .attr("width", width + margin.left + margin.right)
	    .attr("height", height + margin.top + margin.bottom)
	    .append("g")
	    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

	data_serie.forEach(function(line) {
	    line.values.forEach(function(d) {
		d.x = new Date(d.x);
	    });
	});
	
	var xScale = d3.scaleTime()
	    .domain(d3.extent(data_serie[0].values, function(d) { return d.x; }))
	    .range([0, width]);

	var yScale = d3.scaleLinear()
	    .domain([
		d3.min(data_serie, function(line) {
		    return d3.min(line.values, function(d) { return d.y; });
		}),
		d3.max(data_serie, function(line) {
		    return d3.max(line.values, function(d) { return d.y; });
		})
	    ])
	    .range([height, 0]);

	// Define axes
	if (window.innerWidth < 768) {
            xAxis = d3.axisBottom(xScale)
                .tickSize(0)
		.tickSizeInner(5)
                .tickFormat(d3.timeFormat("%Y"))
                .ticks(d3.timeYear.every(20)); // Show ticks every 20 years
        } else {
            xAxis = d3.axisBottom(xScale)
                .tickSize(0)
		.tickSizeInner(5)
                .tickFormat(d3.timeFormat("%Y"))
                .ticks(d3.timeYear.every(10)); // Show ticks every 10 years by default
        }

	var customTickFormat = function(d) {
	    return d > 0 ? "+" + d : d;
	};
	
	var yAxis = d3.axisLeft().scale(yScale)
	    .tickSize(0)
	    .tickSizeInner(-width)
	    .ticks(5)
	    .tickPadding(6)
	    .tickFormat(customTickFormat);
	
	// Append axes
	svg.append("g")
	    .attr("class", "x axis")
	    .attr("transform", "translate(0," + height + ")")
	    .call(xAxis)
	    .selectAll("text")
            .style("fill", "grey")
            .style("font-size", "12px");

	svg.selectAll('.x.axis').selectAll("line")
	    .style("stroke", "#ccc");
	svg.select(".x.axis").select(".domain")
	    .style("stroke", "#aaa");
	
	svg.append("g")
    	    .attr("class", "y axis")
    	    .call(yAxis)
    	    .selectAll("text")
            .style("fill", "grey")
            .style("font-size", "12px");
	
	svg.selectAll('.y.axis').selectAll("line")
	    .style("stroke", "#ccc")
	    .filter(function(d) { return d === 0; })
	    .remove();

	svg.select(".y.axis").select(".domain").remove();

	var line = d3.line()
	    .x(function(d) { return xScale(d.x); })
	    .y(function(d) { return yScale(d.y); });

	var tooltip = d3.select("#grid-line_tooltip");

	var lines = svg.selectAll(".line")
	    .data(data_serie)
	    .enter().append("path")
	    .attr("class", "line")
	    .attr("fill", "none")
	    .attr("id", function(d) { return d.chain; })
	    .attr("d", function(d) { return line(d.values); })
	    .attr("opacity", function(d) { return d.opacity; })
	    .attr("stroke", function(d) { return d.color; })
	    .attr("stroke-width", function(d) { return d.stroke_width; });
	
	lines.on("mouseover", function(event, d) {
	    if (d.order === 2) {
		d3.select(this)
		    .attr("stroke-width", "2px");
		d3.select("#" + d.chain + "_back")
		    .attr("stroke-width", "5px");
		tooltip.style("opacity", 1)
		    .style("color", d.color)
		    .html(d.chain.replace(/_/g, " "));
		
	    } else if (d.order === 0) {
		d3.select(this)
		    .attr("opacity", "1");
		tooltip.style("opacity", 1)
		    .style("color", d.color)
		    .html(d.chain.replace(/_/g, " "));
	    }
	});
	lines.on("mouseout", function(event, d) {
            d3.select(this)
		.attr("opacity", d.opacity)
		.attr("stroke-width", d.stroke_width);
	    if (d.order === 2) {
		d3.select("#" + d.chain + "_back")
		    .attr("stroke-width", "3px");
	    }
            tooltip.style("opacity", 0);
	});
	
	svg.append("line")
	    .attr("class", "zero-line")
	    .attr("x1", 0)
	    .attr("y1", yScale(0))
	    .attr("x2", width)
	    .attr("y2", yScale(0))
	    .style("stroke", "#555")
	    .style("stroke-dasharray", ("3, 3"))
	    .style("stroke-width", 1);
    }
}







function update_grid(data_back) {

    var variable = data_back.variable_fr;
    if (variable.includes("_")) {
	variable = variable.match(/([^_]*)_/)[1];
    }
    
    var n = get_n();
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
    
    document.getElementById("grid-variable_variable").textContent = variable;
    document.getElementById("grid-variable_sampling-period").innerHTML = "Année hydrologique " + sampling_period;
    document.getElementById("grid-variable_name").innerHTML = data_back.name_fr;
    
    document.getElementById("grid-horizon_name").innerHTML = "Horizon " + horizon.name;

    horizon_period = horizon.period.replace(/ - /g, "</b> à <b>");
    document.getElementById("grid-horizon_period-l1").innerHTML = "Période futur de <b>" + horizon_period + "</b>";
    document.getElementById("grid-horizon_period-l2").innerHTML = "Période de référence de <b>1976</b> à <b>2005</b>";

    $(".grid-n_text").css("display", "flex");
    document.getElementById("grid-n_number").innerHTML = n;
    
    var url = window.location.pathname;
    if (url === "/exploration-avancee") {
	$("#grid-chain_drawer-narratif").css("display", "none");
	$("#grid-chain_drawer-RCP").css("display", "none");
	$("#grid-chain_drawer-chain").css("display", "none");
	
	if (drawer_mode === "drawer-narratif") {
	    $("#grid-chain_drawer-narratif").css("display", "flex");
	    
	} else if (drawer_mode === "drawer-RCP") {
    	    $("#grid-chain_drawer-RCP").css("display", "flex");

	    var RCP_value = get_RCP_value();
	    $("#grid-chain_RCP26-text").css("display", "none");
	    $("#grid-chain_RCP45-text").css("display", "none");
	    $("#grid-chain_RCP85-text").css("display", "none");
	    
	    if (RCP_value === "26") {
		$("#grid-chain_RCP26-text").css("display", "block");
	    } else if (RCP_value === "45") {
		$("#grid-chain_RCP45-text").css("display", "block");
	    } else if (RCP_value === "85") {
		$("#grid-chain_RCP85-text").css("display", "block");
	    }
	    
	} else if (drawer_mode === "drawer-chain") {
	    $("#grid-chain_drawer-chain").css("display", "flex");
	}
    }
    
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
    svg.attr("height", (Palette.length - 1) * step + shift * 2);
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
    circles.exit().remove();

    // Ensure width and height are set to prevent distortion
    const bbox = svgNode.getBBox();  // Get bounding box of the content
    svgNode.setAttribute("viewBox", `${bbox.x - 2} ${bbox.y - 2} ${bbox.width + 2} ${bbox.height + 2}`);  // Set viewBox
    svgNode.setAttribute("width", bbox.width);  // Set width
    svgNode.setAttribute("height", bbox.height);  // Set height
    svgNode.setAttribute("preserveAspectRatio", "xMidYMid meet");  // Preserve aspect ratio
}




let selected_code = null;

const fill_entiteHydro = "transparent";
const stroke_entiteHydro = "#000000";

const fill_france = "transparent";
const stroke_france = "#89898A";
/* "#3D3E3E"; */
const fill_basinHydro = "transparent";
const stroke_basinHydro = "#ACACAD";
const stroke_river = "#B0D9D6";
const stroke_river_selected = "#7BBFBA";

const minZoom = 1;
const maxZoom = 4;
const maxPan = 0;
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

let width = window.innerHeight;
let height = window.innerHeight;

let projectionMap;

let currentZoomLevel = 1;


// function update_map(id_svg, svgElement, data_back) {

//     riverLength = riverLength_max;
    
//     d3.select(id_svg).selectAll("*").remove();

//     if (drawer_mode === 'drawer-narratif') {
// 	var fact = 2;
//     } else {
// 	var fact = 1;
//     }

//     function redrawMap() {

// 	const pathGenerator = d3.geoPath(projectionMap);
// 	const selectedGeoJSON_river = {
// 	    type: "FeatureCollection",
// 	    features: geoJSONdata_river.features.filter((d) => {
// 		return d.properties.norm >= riverLength;
// 	    })
// 	};
// 	const simplifiedselectedGeoJSON_river = geotoolbox.simplify(selectedGeoJSON_river, { k: k_simplify, merge: false });
// 	const simplifiedGeoJSON_basinHydro = geotoolbox.simplify(geoJSONdata_basinHydro, { k: k_simplify, merge: false });
// 	const simplifiedGeoJSON_france = geotoolbox.simplify(geoJSONdata_france, { k: k_simplify, merge: false });
// 	// const selectedGeoJSON_river = geotoolbox.filter(geoJSONdata_river, (d) => d.norm >= riverLength);

// 	svgElement.selectAll("path.river")
// 	    .data(simplifiedselectedGeoJSON_river.features)
// 	    .join("path")
// 	    .attr("class", "river")
//     	    .attr("fill", "transparent")
// 	    .attr("stroke", stroke_river)
// 	    .attr("stroke-width", function(d) {
// 		return strokeWith_river_max - (1 - d.properties.norm) * (strokeWith_river_max - strokeWith_river_min);
// 	    })
// 	    .attr("stroke-linejoin", "miter")
// 	    .attr("stroke-linecap", "round")
// 	    .attr("stroke-miterlimit", 1)
// 	    .attr("z-index", 1)
// 	    .attr("d", pathGenerator)
// 	    .transition()
// 	    .duration(1000);
	
// 	svgElement.selectAll("path.basinHydro")
// 	    .data(simplifiedGeoJSON_basinHydro.features)
// 	    .join("path")
// 	    .attr("class", "basinHydro")
//     	    .attr("fill", fill_basinHydro)
// 	    .attr("stroke", stroke_basinHydro)
// 	    .attr("stroke-width", strokeWith_basinHydro)
// 	    .attr("stroke-linejoin", "miter")
// 	    .attr("stroke-miterlimit", 1)
// 	    .attr("d", pathGenerator)
// 	    .transition()
// 	    .duration(1000);
	
// 	svgElement.selectAll("path.france")
// 	    .data(simplifiedGeoJSON_france.features)
// 	    .join("path")
// 	    .attr("class", "france")
//     	    .attr("fill", fill_france)
// 	    .attr("stroke", stroke_france)
// 	    .attr("stroke-width", strokeWith_france)
// 	    .attr("stroke-linejoin", "miter")
// 	    .attr("stroke-miterlimit", 1)
// 	    .attr("d", pathGenerator)
// 	    .transition()
// 	    .duration(1000);

// 	if (data_back) {
// 	    svgElement = redrawPoint(svgElement, data_back);
// 	    highlight_selected_point();
// 	}
//     }
//     const redrawMap_debounce = debounce(redrawMap, 100);
//     // const redrawMap_debounce = debounce(() => redrawMap(svgElement), 100);

//     function handleResize() {
// 	if (window.innerWidth < window.innerHeight) {
// 	    var width = window.innerWidth / fact;
// 	    var height = window.innerWidth / fact;
// 	} else {
// 	    var width = (window.innerHeight - 50 ) / fact;
// 	    var height = (window.innerHeight - 50) / fact;
// 	}

// 	zoom.translateExtent([[-width*maxPan, -height*maxPan], [width*(1+maxPan), height*(1+maxPan)]]);
// 	svgElement.attr("width", width).attr("height", height);
// 	projectionMap.scale([height*scale]).translate([width / 2, height / 2]);	    

// 	redrawMap();
// 	highlight_selected_point();
//     }
//     window.addEventListener("resize", handleResize.bind(null, k_simplify, riverLength));

    
//     const zoom = d3.zoom()
// 	  .scaleExtent([minZoom, maxZoom])
// 	  .on("zoom", function (event) {
// 	      riverLength = riverLength_max - (event.transform.k - minZoom)/(maxZoom-minZoom)*(riverLength_max-riverLength_min);
// 	      k_simplify = k_simplify_ref + (event.transform.k - minZoom)/(maxZoom-minZoom)*(1-k_simplify_ref);
// 	      svgElement.attr("transform", event.transform);
// 	      svgElement.style("width", width * event.transform.k + "px");
// 	      svgElement.style("height", height * event.transform.k + "px");
// 	      redrawMap_debounce();
// 	      highlight_selected_point();
// 	  });

//     projectionMap = d3.geoMercator()
// 	  .center(geoJSONdata_france.features[0].properties.centroid);

//      svgElement = d3.select(id_svg)
// 	.attr("width", "100%")
// 	.attr("height", "100%")
// 	.append("g");

//     svgElement.call(zoom)

//     redrawMap();
//     handleResize();

//     return svgElement
// }




function update_map(id_svg, svgElement, data_back) {

    riverLength = riverLength_max;
    
    d3.select(id_svg).selectAll("*").remove();

    if (drawer_mode === 'drawer-narratif') {
	var fact = 2;
    } else {
	var fact = 1;
    }

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
	    .on("mouseover", function(event, d) {
		d3.select(this).attr("stroke", stroke_river_selected);
		document.getElementById("panel-hover").style.display = "block";
		document.getElementById("panel-hover_code").innerHTML =
		    "<span style='font-weight: 900; color:" + stroke_river_selected + "'>" +
		    d.properties.TopoOH + "</span>";
	    })
	    .on("mouseout", function(event, d) {
		d3.select(this).attr("stroke", stroke_river);
		document.getElementById("panel-hover").style.display = "none";
	    })
	    .transition()
	    .duration(1000);
	
	layer_basin.selectAll("path.basinHydro")
	    .data(simplifiedGeoJSON_basinHydro.features)
	    .join("path")
	    .attr("class", "basinHydro")
	    // .style("pointer-events", "none")
	    .style("pointer-events", "visibleStroke")
    	    .attr("fill", fill_basinHydro)
	    .attr("stroke", stroke_basinHydro)
	    .attr("stroke-width", strokeWith_basinHydro)
	    .attr("stroke-linejoin", "miter")
	    .attr("stroke-miterlimit", 1)
	    .attr("d", pathGenerator)
	    // .on("mouseover", function(event, d) {
		// d3.select(this).attr("stroke", stroke_basinHydro_selected);
		// document.getElementById("panel-hover").style.display = "block";
		// document.getElementById("panel-hover_code").innerHTML =
		    // "<span style='font-weight: 900; color:" + stroke_basinHydro_selected + "'>" +
		    // d.properties.name + "</span>";
	    // })
	    // .on("mouseout", function(event, d) {
		// d3.select(this).attr("stroke", stroke_basinHydro);
		// document.getElementById("panel-hover").style.display = "none";
	    // })
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

	if (data_back) {
	    svgElement = redrawPoint(svgElement, data_back);
	    highlight_selected_point();
	}
    }
    const redrawMap_debounce = debounce(redrawMap, 100);
    // const redrawMap_debounce = debounce(() => redrawMap(svgElement), 100);

    function handleResize() {
	if (window.innerWidth < window.innerHeight) {
	    var width = window.innerWidth / fact;
	    var height = window.innerWidth / fact;
	} else {
	    var width = (window.innerHeight - 50 ) / fact;
	    var height = (window.innerHeight - 50) / fact;
	}

	zoom.translateExtent([[-width*maxPan, -height*maxPan], [width*(1+maxPan), height*(1+maxPan)]]);
	svgElement.attr("width", width).attr("height", height);
	projectionMap.scale([height*scale]).translate([width / 2, height / 2]);	    

	redrawMap();
	highlight_selected_point();
    }
    window.addEventListener("resize", handleResize.bind(null, k_simplify, riverLength));

    
    const zoom = d3.zoom()
	  .scaleExtent([minZoom, maxZoom])
	  .on("zoom", function (event) {
	      riverLength = riverLength_max - (event.transform.k - minZoom)/(maxZoom-minZoom)*(riverLength_max-riverLength_min);
	      k_simplify = k_simplify_ref + (event.transform.k - minZoom)/(maxZoom-minZoom)*(1-k_simplify_ref);
	      svgElement.attr("transform", event.transform);
	      svgElement.style("width", width * event.transform.k + "px");
	      svgElement.style("height", height * event.transform.k + "px");
	      redrawMap_debounce();
	      highlight_selected_point();
	  });

    projectionMap = d3.geoMercator()
	  .center(geoJSONdata_france.features[0].properties.centroid);

    const root = d3.select(id_svg)
	  .attr("width", "100%")
	  .attr("height", "100%");

    root.selectAll("*").remove();

    svgElement = root.append("g");

    const zoomLayer = root.append("g").attr("id", "zoom-layer");
    const layer_river = svgElement.append("g").attr("class", "layer-river");
    const layer_basin = svgElement.append("g").attr("class", "layer-basinHydro");
    const layer_france = svgElement.append("g").attr("class", "layer-france");

    // svgElement.call(zoom)
    root.call(zoom); // zoom is attached to <svg>, transform affects zoomLayer

    redrawMap();
    handleResize();

    return svgElement
}




function isMapZoomed() {
    return k_simplify !== k_simplify_ref;
}


const stroke_selectPoint = "#3b3b3c";

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
		    .attr("stroke", stroke_selectPoint)
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


function redrawPoint(svgElement, data_back) {
    
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
	    .attr("r", 3)
	    .attr("fill", function(d) {
		return d.fill;
	    })

	    .on("mouseover", function(event, d) {
		if (!d3.select(this).classed("clicked")) {
		    d3.select(this).attr("stroke", stroke_selectPoint);
		}

		document.getElementById("panel-hover").style.display = "block";
		document.getElementById("panel-hover_code").innerHTML =
		    "<span style='font-weight: 900; color:" + d.fill_text + ";'>" +
		    d.code + "</span>";
		// const value = d.value.toFixed(2);
		// document.getElementById("panel-hover_value").innerHTML =
		// "<span style='color:" + d.fill_text + ";'>" +
		// "<span style='font-weight: 900;'>" +
		// (value > 0 ? "+" : "") + value + " </span>%</span>";
		
	    })
	    .on("mouseout", function(event, d) {
		if (!d3.select(this).classed("clicked")) {
		    d3.select(this).attr("stroke", "none");
		}
		document.getElementById("panel-hover").style.display = "none";
	    })
	    .on("click", function(d, point) {
		show_serie(data_back, point.code);
	    });
    }
    
    return svgElement
}







function drawSVG_for_export(id_svg, Height, Width, narratif_text="", narratif_color="") {
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
    const france_scale = 1700/franceHeight;
    const france_left = 2;
    const france_top = 250;

    // combinedSVG.append(() => clonedSvgFrance)
	// .attr("transform", `translate(${france_left}, ${france_top}) scale(${france_scale})`);
    
    // const franceGroup = combinedSVG.append("g")
	  // .attr("transform", `translate(${france_left}, ${france_top}) scale(${france_scale})`);
    // franceGroup.node().appendChild(clonedSvgFrance);

    clonedSvgFrance.setAttribute("viewBox", `0 0 ${franceWidth} ${franceHeight}`);
    clonedSvgFrance.setAttribute("width", france_scale * franceWidth);
    clonedSvgFrance.setAttribute("height", france_scale * franceHeight);
    combinedSVG.append(() => clonedSvgFrance)
	.attr("transform", `translate(${france_left}, ${france_top})`);

    var colorbar_right;
    
    if (isMapZoomed()) {
	colorbar_right = 340;
	combinedSVG.append("rect")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", 2000)
            .attr("height", 350)
            .attr("fill", "#F5F5F5");

	combinedSVG.append("rect")
            .attr("x", 0)
            .attr("y", 1710)
            .attr("width", 2000)
            .attr("height", 290)
            .attr("fill", "#F5F5F5");

	combinedSVG.append("rect")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", 70)
            .attr("height", 2000)
            .attr("fill", "#F5F5F5");

	combinedSVG.append("rect")
            .attr("x", 1620)
            .attr("y", 0)
            .attr("width", 380)
            .attr("height", 2000)
            .attr("fill", "#F5F5F5");
    } else {
	colorbar_right = 440;
    }

    const colorbar_height = 850;
    const colorbar_scale = colorbar_height/colorbarHeight;
    
    const colorbar_top = 670;
    const colorbar_width_shift = 12;
    const colorbar_height_shift = 0;
    
    // combinedSVG.append(() => clonedSvgColorbar)
        // .attr("transform", `translate(${Width-colorbar_right}, ${colorbar_top}) scale(${colorbar_scale})`);

    // const colorbarGroup = combinedSVG.append("g")
	  // .attr("transform", `translate(${Width-colorbar_right}, ${colorbar_top}) scale(${colorbar_scale})`);
    // colorbarGroup.node().appendChild(clonedSvgColorbar);

    clonedSvgColorbar.setAttribute("viewBox", `0 0 ${colorbarWidth + colorbar_width_shift} ${colorbarHeight + colorbar_height_shift}`);
    clonedSvgColorbar.setAttribute("width", colorbar_scale * colorbarWidth);
    clonedSvgColorbar.setAttribute("height", colorbar_scale * colorbarHeight);
    combinedSVG.append(() => clonedSvgColorbar)
	.attr("transform", `translate(${Width-colorbar_right}, ${colorbar_top})`);

    
    var title = data_point.name_fr;
    const width_max_title = 42;
    let title_wrap = wrapTextByCharacterLimit(title, width_max_title);

    let title_text_shift_top;
    let title_text_add_top;
    if (title_wrap.length == 1) {
	title_text_shift_top = 25;
	title_text_add_top = 0;
    } else {
	title_text_shift_top = 0;
	title_text_add_top = 90;
    }

    const header_line_left1 = 64;
    const header_line_top1 = 30 + title_text_shift_top;
    const header_line_left2 = 64;
    const header_line_top2 = 230 + title_text_shift_top + title_text_add_top;
    combinedSVG.append("line")
	.attr("x1", header_line_left1)
	.attr("y1", header_line_top1) 
	.attr("x2", header_line_left2)
	.attr("y2", header_line_top2) 
	.attr("stroke", "#C5E7E7")
	.attr("stroke-width", "35px");
    
    const title_text_left = 120;
    const title_text_top = 90 + title_text_shift_top;    
    combinedSVG.append("text")
        .attr("x", title_text_left)
        .attr("y", title_text_top)
        .attr("text-anchor", "start")
        .attr("font-size", "76px")
	.attr("font-family", "Raleway, sans-serif")
	.attr("font-weight", "800")
        .attr("fill", "#16171f")
        .selectAll("tspan")
        .data(title_wrap)
        .enter().append("tspan")
        .attr("x", title_text_left)
        .attr("dy", (d, i) => i === 0 ? 0 : "1.1em")
        .text(d => d);

    
    var horizon = get_horizon();
    var relatif = data_point.to_normalise ? "relatifs " : "";
    var subtitle = "Changements " + relatif + horizon.text + " par rapport à la période de référence 1976-2005";
    const width_max_subtitle = 60;
    let subtitle_wrap = wrapTextByCharacterLimit(subtitle, width_max_subtitle);
    
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


    
    let top_text = "";
    let top_text_color = "transparent";

    let width_max_chain_text = 56;
    let chain_text_shift = 0;
    let chain_text;
    var projection = get_projection();
    if (drawer_mode === 'drawer-narratif') {
	chain_text = "Chaînes de modélisation par narratif sous le";
	top_text = narratif_text;
	top_text_color = narratif_color;
    } else if (drawer_mode === 'drawer-RCP') {
	// width_max_chain_text = 56;
	// chain_text_shift = 60;
	chain_text = "Ensemble des chaînes de modélisation pour le";
	if (projection.RCP === "RCP 2.6") {
	    top_text = "Scénario où des efforts importants sont fait pour réduire les émissions.";
	    top_text_color = "#003466";
	} else if (projection.RCP === "RCP 4.5") {
	    top_text = "Scénario où des efforts modérés sont fait pour réduire les émissions.";
	    top_text_color = "#70A0CD";
	} else if (projection.RCP === "RCP 8.5") {
	    top_text = "Scénario où l'augmentation des émissions continue selon la tendance actuelle.";
	    top_text_color = "#990002";
	}
    } else if (drawer_mode === 'drawer-chain') {
	// /!\ PB : le nombre de HM dépend de la sélection
	const nChain = 0;
	chain_text = "Sélection de " + projection.chain.length + " chaînes de modélisation sous le";
    }
    const RCP_text = projection.RCP;
    const model_text = "avec au moins " + get_n() + " modèles hydrologiques par point";
    chain_text = chain_text + " " + RCP_text + " " + model_text;

    const width_max_top_text = 34;
    const top_text_wrap = wrapTextByCharacterLimit(top_text, width_max_top_text);
    // const top_text_right = 800;
    const top_text_right = 150;
    const top_text_top = 450;
    combinedSVG.append("text")
        .attr("x", Width - top_text_right)
        .attr("y", top_text_top)
        .attr("text-anchor", "end")
        .attr("font-size", "40px")
	.attr("font-family", "Raleway, sans-serif")
	.attr("font-weight", "600")
        .attr("fill", top_text_color)
        .selectAll("tspan")
        .data(top_text_wrap)
        .enter().append("tspan")
        .attr("x", Width - top_text_right)
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
    

    const i_text_left = 280 - chain_text_shift;
    const i_text_bottom = 195;
    combinedSVG.append("text")
        .attr("x", i_text_left)
        .attr("y", Height - i_text_bottom)
        .attr("text-anchor", "middle")
        .attr("font-size", "40px")
	.attr("font-family", "Georgia, serif")
        .attr("font-weight", "600")
	.attr("fill", "#89898A")
        .text("i");

    const circle_left = 280 - chain_text_shift;
    const circle_bottom = 210;
    const circle_radius = 22;
    combinedSVG.append("circle")
	.attr("cx", circle_left)
	.attr("cy", Height - circle_bottom)
	.attr("r", circle_radius)
	.attr("fill", "transparent")
	.attr("stroke", "#89898A")
	.attr("stroke-width", "5px");
    
    
    const chain_text_wrap = wrapTextByCharacterLimit(chain_text, width_max_chain_text);
    const chain_text_left = 340 - chain_text_shift;
    const chain_text_bottom = 220;
    combinedSVG.append("text")
        .attr("x", chain_text_left)
        .attr("y", Height - chain_text_bottom)
        .attr("text-anchor", "start")
        .attr("font-size", "40px")
	.attr("font-family", "Raleway, sans-serif")
	.attr("font-weight", "500")
        .attr("fill", "#89898A")
        .selectAll("tspan")
        .data(chain_text_wrap)
        .enter().append("tspan")
        .attr("x", chain_text_left)
        .attr("dy", (d, i) => i === 0 ? 0 : "1.1em")
        .text(d => d);
    

    // const footer_sep_line_left1 = 0;
    // const footer_sep_line_bottom1 = 130;
    // const footer_sep_line_right2 = 0;
    // const footer_sep_line_bottom2 = 130;
    // combinedSVG.append("line")
    // 	.attr("x1", footer_sep_line_left1)
    // 	.attr("y1", Height - footer_sep_line_bottom1) 
    // 	.attr("x2", Width - footer_sep_line_right2)
    // 	.attr("y2", Height - footer_sep_line_bottom2) 
    // 	.attr("stroke", "#89898A")
    // 	.attr("stroke-width", "1px");

    
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
        .text("MEANDRE");

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
        .text("meandre.explore2.inrae.fr");


    const footer_line_left1 = 620;
    const footer_line_bottom1 = 100;
    const footer_line_left2 = 620;
    const footer_line_bottom2 = 20;
    combinedSVG.append("line")
	.attr("x1", footer_line_left1)
	.attr("y1", Height - footer_line_bottom1) 
	.attr("x2", footer_line_left2)
	.attr("y2", Height - footer_line_bottom2) 
	.attr("stroke", "#C5E7E7")
	.attr("stroke-width", "10px");

    const footer_text_left = 645;
    const footer_text_bottom = 80;
    combinedSVG.append("text")
        .attr("x", footer_text_left)
        .attr("y", Height - footer_text_bottom)
        .attr("text-anchor", "start")
        .attr("font-size", "25px")
	.attr("font-family", "Lato, sans-serif")
	.attr("font-weight", "400")
        .attr("fill", "#060508")
        .selectAll("tspan")
        .data([
	    "Ces résultats sont issus de projections hydrologiques réalisées sur la France. La mise à jour",
	    "de ces projections a été réalisé entre 2022 et 2024 dans le cadre du projet national Explore2.",
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



function exportSVG() {
    const Height = 2000;
    const Width = 2000;
    const zip = new JSZip(); // Create a ZIP archive
    let pngPromises = [];

    if (drawer_mode === 'drawer-narratif') {
        const svgDataArray = [
            { id: "#svg-france-vert", name: "france-vert",
	      narratif: "Réchauffement marqué et augmentation des précipitations", color: "#569A71"},
            { id: "#svg-france-jaune", name: "france-jaune",
	      narratif: "Changements futurs relativement peu marqués", color: "#EECC66"},
            { id: "#svg-france-orange", name: "france-orange",
	      narratif: "Fort réchauffement et fort assèchement en été (et en annuel)", color: "#E09B2F"},
            { id: "#svg-france-violet", name: "france-violet",
	      narratif: "Fort réchauffement et forts contrastes saisonniers en précipitations", color: "#791F5D"}
        ];

        pngPromises = svgDataArray.map(({id, name, narratif, color}) => {
            return convertSVGToPNG(id, name, zip, Height, Width, narratif, color);
        });

    } else {
        pngPromises.push(convertSVGToPNG("#svg-france", "france", zip, Height, Width));
    }

    // Wait for all PNG conversions to complete, then generate the ZIP
    Promise.all(pngPromises).then(() => {
        zip.generateAsync({ type: "blob" }).then((content) => {
            const link = document.createElement("a");
            link.href = URL.createObjectURL(content);
            link.download = "exported_maps.zip";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        });
    });
}



function convertSVGToPNG(svgSelector, filename, zip, Height, Width, narratif="", color="") {
    return new Promise((resolve) => {
        const combinedSVG = drawSVG_for_export(svgSelector, Height, Width, narratif, color);

        // Fetch the first logo (MEANDRE)
        fetch('/resources/logo/MEANDRE/MEANDRE_logo.svg')
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

function slugify(str) {
    return str
        .normalize('NFD') // Decompose accents
        .replace(/[\u0300-\u036f]/g, '') // Remove accents
        .replace(/\s+/g, '_')
        .toLowerCase();
}


const Storylines_map = {
    "vert": {
	chain: "historical-rcp85_HadGEM2-ES_ALADIN63_ADAMONT",
	info: "Réchauffement marqué et augmentation des précipitations",
	info_readme: "Narratif vert, réchauffement marqué et augmentation\ndes précipitations.",
	color: "#569A71"
    },
    "jaune": {
	chain: "historical-rcp85_CNRM-CM5_ALADIN63_ADAMONT",
	info: "Changements futurs relativement peu marqués",
	info_readme: "Narratif jaune, changements futurs relativement peu marqués.",
	color: "#EECC66"
    },
    "orange": {
	chain: "historical-rcp85_EC-EARTH_HadREM3-GA7_ADAMONT",
	info: "Fort réchauffement et fort assèchement en été (et en annuel)",
	info_readme: "Narratif orange, fort réchauffement et fort assèchement en été\n(et en annuel).",
	color: "#E09B2F"
    },
    "violet": {
	chain: "historical-rcp85_HadGEM2-ES_CCLM4-8-17_ADAMONT",
	info: "Fort réchauffement et forts contrastes saisonniers en précipitations",
	info_readme: "Narratif violet, fort réchauffement et forts contrastes saisonniers\nen précipitations",
	color: "#791F5D"
    }
};


function get_files (data, variable, chain) {
    const csvData_meta_projection = [];
    chain.forEach(item => {
        const components = item.split('_');
	let storyline_name = '';
	let storyline_info = '';
	let storyline_color = '';
	for (const [key, value] of Object.entries(Storylines_map)) {
	    if (item.includes(value.chain)) {
                storyline_name = key;
		storyline_info = value.info;
                storyline_color = value.color;
                break;
	    }
        }
        const row = {
	    chain: item,
	    RCP: components[0],
	    GCM: components[1],
	    RCM: components[2],
	    BC: components[3],
	    HM: components[4],
	    storyline_name: storyline_name,
	    storyline_info: storyline_info,
	    storyline_color: storyline_color
        };
        csvData_meta_projection.push(row);
    });
    const csv_meta_projection = Papa.unparse(csvData_meta_projection, {
        columns: ["chain", "RCP", "GCM", "RCM", "BC", "HM",
		  "storyline_name", "storyline_info", "storyline_color"]
    });
    
    // meta_variable
    const csvData_meta_variable = [];
    const row = {};
    Object.entries(data).forEach(([key, value]) => {
        if (key === 'data') {
	    return;
        }
        if (Array.isArray(value)) {
	    row[key] = value.join(", ");
        } else {
	    row[key] = value;
        }
    });
    csvData_meta_variable.push(row);

    let fieldOrder
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

    // data meta_point
    const csvData_data = [];
    const csvData_meta_point = [];

    data.data.forEach(item => {
	csvData_data.push({
            code: item.code,
            [variable]: item.value,
            fill: item.fill
	});

	const { fill, fill_text, value, ...otherFields } = item;
	csvData_meta_point.push(otherFields);
    });

    // Convert data to CSV format
    const csv_data = Papa.unparse(csvData_data);

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

    const files = {
	"data.csv": csv_data,
	"meta_point.csv": csv_meta_point,
	"meta_variable.csv": csv_meta_variable,
	"meta_projection.csv": csv_meta_projection
    };

    return files;
}


async function exportData() {
    var n = get_n();
    var variable = get_variable();
    var projection = get_projection();
    var horizon = get_horizon();

    var title = data_point.name_fr;
    var relatif = data_point.to_normalise ? "relatifs " : "";
    var subtitle = "Changements " + relatif + horizon.text +
        "\n             par rapport à la période de référence 1976-2005";

    var filename =
        "MEANDRE-export+" +
        "var-" + variable + "+" +
        "H-" + horizon.period.replace(/ - /g, '_') + "+" +
        "n-" + n + "+" +
        "chain-" + slugify(projection.type) +
        ".zip";

    let chain_info;
    if (drawer_mode === 'drawer-RCP') {
        chain_info = "Moyenne multi-modèles par niveau d'émissions.\n";
        if (projection.RCP === "RCP 2.6") {
            chain_info = chain_info + "Le RCP 2.6 est un scénario compatible avec les objectifs\ndes accords de Paris.";
        } else if (projection.RCP === "RCP 4.5") {
            chain_info = chain_info + "Le RCP 4.5 est un scénario où des efforts modérés sont fait pour\nréduire les émissions.";
        } else if (projection.RCP === "RCP 8.5") {
            chain_info = chain_info + "Le RCP 8.5 est un scénario où l'augmentation des émissions\ncontinue selon la tendance actuelle.";
        }
    } else if (drawer_mode === 'drawer-chain') {
        chain_info = "Attention : Chaînes de modélisation spécifiques, l'approche\n" +
            "multi-modèle doit être privilégiée. Le détail des chaînes de\n" +
            "modélisation sélectionnées est disponible dans le fichier\n" +
            "meta_projection.csv"
    }

    // README
    let README = await fetch('/resources/README.txt');
    README = await README.text();
    var time = getFormattedDateTime();
    let param =
        "Titre : " + title + "\n" +
        "Sous-titre : " + subtitle + "\n\n" +
        "Variable : " + variable + "\n" +
        "Unité : " + data_point.unit_fr + "\n" +
        "Horizon : " + horizon.period + "\n" +
        "Nombre de point : Il y a au moins " + n + " modèles hydrologiques par point\n" +
        "Scénario d'émission : " + projection.RCP + "\n" +
        "Chaînes de modélisations : " + projection.type + "\n\n";

    // licence fr
    const pdfResponse_LO_fr = await fetch('/resources/licence_ouverte/ETALAB-Licence-Ouverte-v2.0.pdf');
    const pdf_LO_fr = await pdfResponse_LO_fr.blob();
    // licence en
    const pdfResponse_LO_en = await fetch('/resources/licence_ouverte/ETALAB-Open-Licence-v2.0.pdf');
    const pdf_LO_en = await pdfResponse_LO_en.blob();

    // figure
    const Height = 2000;
    const Width = 2000;

    let zip;

    if (drawer_mode === 'drawer-narratif') {
        const data_point_storyline = {
            "vert": data_point_vert,
            "jaune": data_point_jaune,
            "orange": data_point_orange,
            "violet": data_point_violet
        }
        zip = new JSZip();
        for (const storyline of Object.keys(data_point_storyline)) {
            const folder = zip.folder(storyline);
            const files = get_files(data_point_storyline[storyline],
                variable,
                projection["chain_" + storyline]);
            for (const [fileName, content] of Object.entries(files)) {
                folder.file(fileName, content);
            }

            var param_tmp = param + Storylines_map[storyline].info_readme;
            README_tmp = README
                .replace(/\[DATE\]/g, time)
                .replace(/\[PARAM\]/g, param_tmp);
            folder.file("README.txt", README_tmp);

            folder.file("ETALAB-Licence-Ouverte-v2.0.pdf", pdf_LO_fr);
            folder.file("ETALAB-Open-Licence-v2.0.pdf", pdf_LO_en);

            // Await the PNG conversion
            await convertSVGToPNG("#svg-france-" + storyline, "map-" + storyline,
                folder, Height, Width,
                Storylines_map[storyline].info,
                Storylines_map[storyline].color);
        }

    } else {
        zip = new JSZip();
        const files = get_files(data_point, variable,
            projection.chain);
        for (const [fileName, content] of Object.entries(files)) {
            zip.file(fileName, content);
        }

        var param_tmp = param + chain_info;
        README_tmp = README
            .replace(/\[DATE\]/g, time)
            .replace(/\[PARAM\]/g, param_tmp);
        zip.file("README.txt", README_tmp);

        zip.file("ETALAB-Licence-Ouverte-v2.0.pdf", pdf_LO_fr);
        zip.file("ETALAB-Open-Licence-v2.0.pdf", pdf_LO_en);

        // Await the PNG conversion
        await convertSVGToPNG("#svg-france", "map", zip, Height, Width);
    }

    zip.generateAsync({ type: "blob" })
        .then(function (content) {
            const link = document.createElement("a");
            link.href = URL.createObjectURL(content);
            link.download = filename;
            link.click();
        });
}
