import $ from 'jquery';
import { fetchData } from './queryData.js';
import { plotMap, clearMap } from './mapPanel.js';

export function performSearch() {
    var searchValue = $('#search').val().toLowerCase();

    const searchResults = [];

    $('#detectedFrameworks tbody tr').each(function() {
        var row = $(this);
        var rowText = row.text().toLowerCase();

        if (rowText.includes(searchValue)) {
            row.show();

            // Assuming each row has the relevant data in specific columns
            const indicator = row.find('td:nth-child(1)').text();
            const port = row.find('td:nth-child(2)').text();
            const frameworkDetected = row.find('td:nth-child(3)').text();
            const secondarySource = row.find('td:nth-child(4)').text();
            const confidence = row.find('td:nth-child(5)').text();

            searchResults.push({
                indicator,
                port,
                frameworkDetected,
                secondarySource,
                confidence
            });
        } else {
            row.hide();
        }
    });

    // Transform the search results to the format expected by fetchData
    const transformedData = transformSearchDataToApiFormat(searchResults);

    fetchData(transformedData, (error, data) => {
        if (error) {
            console.error('Error fetching data:', error);
            return;
        }
        updateMapWithTableData(data);
    });
}

function updateMapWithTableData(data) {
    // Clear the existing map data before updating
    clearMap();

    plotMap(data);
}

function transformSearchDataToApiFormat(searchResults) {
    const transformedData = {};

    searchResults.forEach(result => {
        const ip = result.indicator;
        const port = result.port;

        if (!transformedData[ip]) {
            transformedData[ip] = {};
        }

        if (!transformedData[ip][port]) {
            transformedData[ip][port] = [];
        }

        transformedData[ip][port].push({
            indicator: result.indicator,
            port: result.port,
            threat: result.frameworkDetected,  // Adjust if needed
            threat_type: result.threat_type || '',  // Adjust if available
            confidence: result.confidence,
            tlp: result.tlp || '',  // Adjust if available
            type: result.secondarySource
        });
    });

    return transformedData;
}