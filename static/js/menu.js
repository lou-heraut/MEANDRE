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


function selectAllButton(selectedButton) {
    var buttons = selectedButton.parentNode.querySelectorAll('button');
    buttons.forEach(function (button) {
	button.classList.remove('selected');
    });
    selectedButton.classList.add('selected');

    update_data_point_debounce();
}



function selectButton(selectedButton) {
    if (selectedButton.classList.contains('selected')) {
        selectedButton.classList.remove('selected');
    } else {
        selectedButton.classList.add('selected');
    }

    update_data_point_debounce();
}


// function load_slider() {
//     var slider = document.getElementById('slider-n');
    
//     noUiSlider.create(slider, {
// 	start: [default_n],
// 	behaviour: 'drag-smooth-steps-tap',
// 	step: 1,
// 	connect: true,
// 	keyboardDefaultStep: 1,
// 	keyboardPageMultiplier: 2,
// 	keyboardMultiplier: 1,
// 	range: {
// 	    'min': 1,
// 	    'max': 9
// 	},
// 	pips: {
// 	    mode: 'values',
// 	    values: [1, 2, 3, 4, 5, 6, 7, 8, 9],
// 	    density: 100,
// 	}
//     });

//     var startValue = slider.noUiSlider.get();
//     var maxPos = Math.max(startValue) - 1;
//     $(slider).find('.noUi-value:visible').removeClass('highlight').eq(maxPos).addClass('highlight');
    
//     slider.noUiSlider.on('change', function(values) {
//     	var maxPos = Math.max(values) -1;
//         $(slider).find('.noUi-value:visible').removeClass('highlight').eq(maxPos).addClass('highlight');
// 	update_data_point_debounce();
//     });
// }


// function selectVariableButton(selectedButton) {
//     if (selectedButton) {
// 	var buttons = selectedButton.parentNode.querySelectorAll('button');
// 	buttons.forEach(function (button) {
// 	    button.classList.remove('selected');
// 	});
// 	selectedButton.classList.add('selected');
// 	update_data_point_debounce();
//     }
// }


// function selectHorizonButton(selectedButton) {
//     var buttons = selectedButton.parentNode.querySelectorAll('button');
//     buttons.forEach(function (button) {
// 	button.classList.remove('selected');
//     });
//     selectedButton.classList.add('selected');
//     update_data_point_debounce();
// }




function toggle_menu() {
    const menu_container = document.getElementById("container-menu");
    const menu = document.getElementById("menu");
    const icon = document.getElementById("tab_exploration-avancee-icon");
    const title = document.getElementById("tab_exploration-avancee-text");
    const button = document.getElementById("tab_exploration-avancee");
    const bar = document.getElementById("bar");
    
    if (menu_container.classList.contains("expanded")) {
        menu_container.classList.remove("expanded");
        menu.classList.add("hidden");
        icon.style.display = "block"; 
        title.style.display = "block";
	bar.classList.remove("expanded");
	button.classList.remove("expanded");
        setTimeout(() => {
	    icon.classList.remove("expanded");
	    title.classList.remove("expanded");

        }, 300);
    } else {
        menu_container.classList.add("expanded");
        menu.classList.remove("hidden");
	icon.classList.add("expanded");
	title.classList.add("expanded");
	button.classList.add("expanded");
	bar.classList.add("expanded");
        setTimeout(() => {
            icon.style.display = "none";
            title.style.display = "none";
        }, 300);
    }

    setTimeout(() => {
	check_bar();
    }, 300);
}


function change_drawer(drawerId) {
    drawer_mode = drawerId;
    if (drawer_mode === 'drawer-narratif') {
    	$("#svg-france").css("display", "none");
	$("#svg-france-narratif").css("display", "flex");
    } else {
    	$("#svg-france").css("display", "block");
    	$("#svg-france-narratif").css("display", "none");
    }
}

function toggle_drawer(drawerId) {
    var drawer_to_check = ['drawer-narratif',
			   'drawer-RCP',
			   'drawer-chain'];

    if (drawer_to_check.includes(drawerId)) {
	change_drawer(drawerId);
	drawer_to_check.forEach(function(id) {
	    var drawerContent = document.getElementById(id + "-content");
	    var drawerIcon = document.getElementById(id + "-icon");
	    if (id === drawerId) {
		if (drawerContent.classList.contains("expanded")) {
		    drawerContent.classList.remove("expanded");
		    drawerIcon.classList.remove("rotated");
		} else {
		    drawerContent.classList.add("expanded");
		    drawerIcon.classList.add("rotated");
		    update_data_point_debounce();
		}
	    } else {
		if (drawerContent.classList.contains("expanded")) {
		    drawerContent.classList.remove("expanded");
		    drawerIcon.classList.remove("rotated");
		}	
	    }
	})
	
    } else {
	var drawerContent = document.getElementById(drawerId + "-content");
	var drawerIcon = document.getElementById(drawerId + "-icon");
	if (drawerContent.classList.contains("expanded")) {
            drawerContent.classList.remove("expanded");
            drawerIcon.classList.remove("rotated");
	} else {
            drawerContent.classList.add("expanded");
            drawerIcon.classList.add("rotated");
	}
    }


}





function toggleBlock(selectedBlock) {
    var bunch = document.getElementById(selectedBlock.id.replace("button", "bunch"));
    var buttons = bunch.children;
    var buttons = Array.from(buttons);

    var hasSelected = false;
    buttons.forEach(function(button) {
    	if (button.classList.contains("selected")) {
            hasSelected = true;
            return;
    	}
    });

    buttons.forEach(function(button) {
    	if (hasSelected) {
	    if (button.classList.contains("selected")) {
		button.classList.remove("selected");
		show_GCM_RCM(button)
	    }
    	} else {
            button.classList.add("selected");
	    show_GCM_RCM(button)
    	}
    });
}


function show_GCM_RCM(selectedButton) {
    var RCP = selectedButton.id.split('_')[0];
    var GCM = selectedButton.id.split('_')[1];
    var RCM = selectedButton.id.split('_')[2];

    if (GCM === "GCM") {

	var GCM_blockAll = document.querySelectorAll(`[id^="block_"][id$="_GCM"]`);
	GCM_blockAll.forEach(function (GCM_block) {
	    GCM_block.style.display = 'none';
	});
	var GCM_selectedBlock = document.getElementById(`block_${RCP}_GCM`);
	if (GCM_selectedBlock) {
	    GCM_selectedBlock.style.display = 'flex';
	}
	
	var RCM_blockAll = document.querySelectorAll(`[id^="block_"][id$="_RCM"]`);
	RCM_blockAll.forEach(function (RCM_block) {
	    RCM_block.style.display = 'none';
	});

	var RCM_blockAll = document.querySelectorAll(`[id^="block_${RCP}"][id$="_RCM"]`);

	var GCM_selectedBunch = document.getElementById(`bunch_${RCP}_GCM`);
	var GCM_buttonSelected = GCM_selectedBunch.querySelectorAll('.selected');
	var GCM_selected = Array.from(GCM_buttonSelected).map(button => button.id.split('_')[1]);

	
	RCM_blockAll.forEach(function (RCM_block) {
	    var GCM = RCM_block.id.split('_')[2];
	    if (GCM_selected.includes(GCM)) {
		RCM_block.style.display = 'flex';
	    } else {
		RCM_block.style.display = 'none';
	    }
	});

    }
    if (RCM === "RCM") {
	var RCM_selectedBlock = document.getElementById(`block_${RCP}_${GCM}_RCM`);
	if (RCM_selectedBlock.style.display === 'flex') {
	    RCM_selectedBlock.style.display = 'none';
	} else {
	    RCM_selectedBlock.style.display = 'flex';
	}
    }

}





function show_HM(selectedButton) {
    var BC = selectedButton.id.split('_')[0];
    var HM = selectedButton.id.split('_')[1];
    
    if (HM === "HM") {
	var HM_selectedBlock = document.getElementById(`block_${BC}_HM`);
	if (HM_selectedBlock.style.display === 'flex') {
	    HM_selectedBlock.style.display = 'none';
	} else {
	    HM_selectedBlock.style.display = 'flex';
	}
    }
}


function get_n() {
    var slider = document.getElementById('slider-n');
    var n = parseInt(slider.noUiSlider.get());
	// var n = 7
    return n;
}

function get_variable() {
    var variableBunch = $('#bunch-variable');
    var selectedButton = variableBunch.find('.selected')[0];

    if (selectedButton) {
	var variableName = selectedButton.getAttribute('value');
	return variableName;
    } else {
	return null
    }
}

function get_horizon() {
    var bunchHorizon = $('#bunch-gwl');
    var buttonHorizon = bunchHorizon.find('.selected')[0];
    var H = buttonHorizon.getAttribute('value');
	console.log(H)

    if (H === "H1") {
	var horizon_period = "2021 - 2050";
	var horizon_name = "proche";
	var horizon_text = "en début de siècle 2021-2050";
	
    } else if (H === "H2") {
	var horizon_period = "2041 - 2070";
	var horizon_name = "moyen";
	var horizon_text = "en milieu de siècle 2041-2070";
	
    } else if (H === "H3") {
	var horizon_period = "2070 - 2099";
	var horizon_name = "lointain";
	var horizon_text = "en fin de siècle 2070-2099";
    } else if (H === "gwl15") {
	var horizon_name = "+2.0°C";
	var horizon_text = "pour une France à +2.0°C";
    } else if (H === "gwl20") {
	var horizon_name = "+2.7°C";
	var horizon_text = "pour une France à +2.7°C";
    } else if (H === "gwl30") {
	var horizon_name = "+4.0°C";
	var horizon_text = "pour une France à +4.0°C";
    }

    const horizon = {
	H: H,
	period: horizon_period,
	name: horizon_name,
	text: horizon_text
    };

    return horizon;
}


function get_chunk_of_chain(value, search="selected") {
    var blockChain = $(value);
    var buttonsChain = blockChain.find("." + search);
    
    var Chain = [];
    buttonsChain.each(function() {
	Chain.push($(this).attr('id'));
    });
    var Chain = Chain.filter(function(item, index, self) {
	return self.indexOf(item) === index;
    });
    return Chain;
}


function get_HM() {
    var BC_HM = get_chunk_of_chain('[id^="block_"][id$="_HM"]:visible');
    var HM = BC_HM.map(item => item.split('_')[1]);
    HM = unique(HM);
    return HM;
}

const RCP_map = {
    "26": {
	name: "RCP 2.6"
    },
    "45": {
	name: "RCP 4.5"
    },
    "85": {
	name: "RCP 8.5"
    }
};

const RCP_value = "85"
// function get_RCP_value() {
//     var RCP_value = "85"
//     return RCP_value;
// }

function get_narratif_only() {
    var container = document.getElementById('bunch_narratif');
    var selectedButtons = container.querySelectorAll('div.selected');
    var values = [];
    selectedButtons.forEach(function(button) {
        values.push(button.getAttribute('value'));
    });
    return values;
}


function get_projection() {

	var type = "Sélection par narratif";
	if (selected_storyline) {
		var exp = selected_storyline.chain.split('_')[0].replace('-', '_');
		
		var projection = {
			type: type,
			RCP: RCP_map[RCP_value].name,
			exp: exp,
			chain: selected_storyline.chain
		};
	} else {
		var projection = null
	}
    
    return projection;
}


