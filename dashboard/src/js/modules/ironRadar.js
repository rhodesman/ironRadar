import $ from "jquery";

/*import { msalInstance, initializeMsal, login } from './ironRadar/MSAuth';

document.addEventListener('DOMContentLoaded', () => {
  const loginButton = document.getElementById('loginButton');
  loginButton.addEventListener('click', login);
});
*/

import { apiURL } from './ironRadar/config.js';

import {
    processData,
    updateUI,
    setupEventListeners,
    processPorts
} from './ironRadar/processData.js';

import { 
    exportData,
    printScreen,
    setCardHeights,
    flattenData
 } from './ironRadar/generalUI.js';

//import { setColumnWidths } from './ironRadar/frameworkTable.js';
//import { fetchData } from './ironRadar/queryData.js';
//import { drawMap} from './ironRadar/mapPanel.js';
//import { performSearch } from './ironRadar/search.js';
import { renderPieChart, renderPortChart } from './ironRadar/charts.js';
import { initializeSorting } from './ironRadar/sort.js';

let returnedData;

$(document).ready(function() {
    setCardHeights();

    initializeSorting();

    $.getJSON(apiURL, function(data) {
        returnedData = data;
        const processedData = processData(data);
        updateUI(processedData, renderPieChart, renderPortChart);
        setupEventListeners(data);

        // Hide the loading spinner
        $('#onPageLoad').addClass('hide');

        setTimeout(function() {
            $('#onPageLoad').remove();
          }, 1500);

    }).fail(function() {
        console.error("Failed to fetch ironRadar data");
    });
    
    $('#btnPrint').on('click', printScreen);

    $('#upload-json-button').on("click", function(event) {
        event.preventDefault();
        exportData(returnedData);
    });

    $('#expandTable').on("click", function() {
        var frameworkList = $('#frameworkList');
        frameworkList.toggleClass('expandedPanel');
        frameworkList[0].offsetHeight;
    });
    
    
});
