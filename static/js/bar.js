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


function toggle_subtab(tab_button) {

    var tab = tab_button.parentNode;
    var subbars = $('.subbar');

    subbars.each(function() {
        var subbar = $(this);
        var subtabs = $("[id^='" + subbar.attr("id") + "'][class^='subbar-tab']");

        if (subbar.hasClass("expanded")) {
            // Collapse open subbar
            subtabs.each(function() {
                $(this).removeClass("expanded");
            });
            setTimeout(() => {
                subbar.removeClass("expanded");
                subtabs.each(function() {
                    $(this).css("display", "none");
                });
            }, 300);
        } 
        else if (subbar.attr("id").startsWith(tab.id)) {
            // Expand clicked one
            subbar.addClass("expanded");
            subtabs.each(function() {
                $(this).css("display", "flex");
            });
            setTimeout(() => {
                subtabs.each(function() {
                    $(this).addClass("expanded");
                });
            }, 300);

            // Only auto-switch if NO subtab is already selected
            setTimeout(() => {
                var selectedInSubbar = subtabs.filter('.selected');
                if (selectedInSubbar.length === 0) {
                    var firstSubtab = subtabs.first();
                    if (firstSubtab.length > 0) {
                        var onclickAttr = firstSubtab.attr("onclick");
                        if (onclickAttr) {
                            var match = onclickAttr.match(/change_url\(['"]([^'"]+)['"]\)/);
                            if (match) {
                                change_url(match[1]);
                            }
                        }
                    }
                }
            }, 350); // wait for expansion
        }
    });

    setTimeout(() => {
        check_bar();
    }, 300);
}


function check_bar() {
    var bar = document.getElementById("bar");
    var sep = document.getElementById("last-sep");
    var arrows = $('.arrow');
    
    if (bar.scrollWidth > bar.offsetWidth) {
	arrows.each(function() {
	    $(this).addClass("show");
	});
	sep.style.display = "none";
    } else {
	arrows.each(function() {
	    $(this).removeClass("show");
	});
	sep.style.display = "inline-flex";
    }
}
window.addEventListener('resize', function() {
    check_bar();
});

function scroll_bar_left() {
    var bar = document.getElementById('bar');
    bar.scrollBy({ left: -200, behavior: 'smooth' });
}
function scroll_bar_right() {
    var bar = document.getElementById('bar');
    bar.scrollBy({ left: 200, behavior: 'smooth' });
}


function select_tab() {
    var url = window.location.href;
    var path = new URL(url).pathname;
    var parts = path.split('/');
    var tab = parts[1];
    var subtab = parts[2];
    
    const tabs = document.querySelectorAll('.bar-tab');
    tabs.forEach(tab => {
        tab.classList.remove('selected');
    });
    const subtabs = document.querySelectorAll('.subbar-tab');
    subtabs.forEach(tab => {
        tab.classList.remove('selected');
    });
    
    var selected_tab = $("#tab_" + tab);
    selected_tab.addClass('selected');

    var selected_close_tab = $("#tab_close_" + tab);
    selected_close_tab.addClass('selected');
    
    var selected_subtab = $("#tab_" + tab + "_" + subtab);
    selected_subtab.addClass('selected');
}
