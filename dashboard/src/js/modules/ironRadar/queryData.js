import { getGeoData } from './config.js';
import { drawMap } from './mapPanel.js';

export function fetchData(inputData, callback) {
    fetch(getGeoData, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ data: inputData })
    })
    .then(response => response.json())
    .then(data => {
        if (callback && typeof callback === 'function') {
            callback(null, data.received);
        } else {
            drawMap(data.received);
        }
    })
    .catch(error => {
        if (callback && typeof callback === 'function') {
            callback(error, null);
        } else {
            console.error('Error fetching data:', error);
        }
    });
}