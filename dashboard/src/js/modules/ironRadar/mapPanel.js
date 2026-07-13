// ************ //
/* Draw Map with GeoLocation data */
// ************ //
import $ from 'jquery';
import jsVectorMap from 'jsvectormap';
import { getGeoData } from './config.js';

let map;

export function drawMap(mapData) {
    clearMap();
    plotMap(mapData);
}

export function clearMap() {
    var $currentMap = $('#world_map');
    if ($currentMap.contents().length > 0) {
        $currentMap.empty();
    }
}

export function plotMap(mapData) {

    const keysArray = Object.keys(mapData).filter(key => key && key !== 'Unknown');

    console.log('map data:', mapData);

    // Create a data object for series
    const regionData = {};
    keysArray.forEach(key => {
        regionData[key] = mapData[key].count;
    });
    
    map = new jsVectorMap({
        map: "world",
        selector: "#world_map",
        zoomButtons: true,
        zoomOnScroll: true,
        regionStyle: {
            selectedHover: {
                fill: '#5c5cff',
                stroke: '#ffffff',
                strokeWidth: 1
            }
        },
        regionsSelectable: false,
        selectedRegions: keysArray,
        series: {
            regions: [{
                attribute: 'fill',
                values: regionData,
                scale: ['#e4002b', '#800018'],
                normalizeFunction: 'polynomial'
            }]
        },
        onRegionTooltipShow(event, label, code) {
            
            if (mapData[code]) {
                label.text(
                    `<h5>${label.text()}</h5>` +
                    `<p>Threats: ${mapData[code].count}</p>`,
                    true
                );
            }
        }
    });

    window.addEventListener("resize", () => {
        map.updateSize();
    });

    createLegend();
}

function createLegend() {
    const legendData = [
        { color: '#e4002b', label: 'High Threat' },
        { color: '#800018', label: 'Medium Threat' },
        { color: '#ffe400', label: 'Low Threat' },
        { color: '#00e400', label: 'No Threat' }
    ];

    const $legend = $('#mapLegend');
    $legend.empty();

    legendData.forEach(item => {
        const $legendItem = $('<div/>', { 'class': 'legend-item' });
        const $colorBox = $('<div/>', { 'class': 'color-box', 'css': { 'background-color': item.color } });
        const $label = $('<span/>', { text: item.label });

        $legendItem.append($colorBox).append($label);
        $legend.append($legendItem);
    });
}