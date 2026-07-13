// server/server.js
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const geoip = require('geoip-lite');

require('dotenv').config();

var jsdom = require('jsdom');
const { JSDOM } = jsdom;
const { window } = new JSDOM();
const { document } = (new JSDOM('')).window;
global.document = document;

var $ = jQuery = require('jquery')(window);

geoip.startWatchingDataUpdate(path.join(__dirname, 'data', 'data/GeoLite2-City.mmdb'), { watchForUpdates: true });
const app = express();
const PORT = process.env.PORT || 8888;
app.use(cors()); 

app.use(express.json({ limit: '10mb' }));
app.use(express.static('dist'));
app.use(bodyParser.urlencoded({ extended: true }));


// ************ //
/* START GeoLocated data */
// ************ //
function parseGeoData(threatData) {
    //Convert raw data output to GeoLocate IPs

    var data = threatData.data;
    var ipCounts = {};
    var countryData = {};

    // Gather unique IPs and count them
    $.each(data, function(ip) {
        if (!ipCounts[ip]) {
            ipCounts[ip] = 1;
        } else {
            ipCounts[ip]++;
        }
    });

    // Process each IP to get country and coordinates
    for (let ip of Object.keys(ipCounts)) {
        try {
            let result = getCountry(ip);
            let country = result.country;

            if (countryData[country]) {
                countryData[country].count += ipCounts[ip];
                // Consider averaging coordinates or just keeping the first/last seen.
                countryData[country].coordinates = result.coordinates;
            } else {
                countryData[country] = {
                    count: ipCounts[ip],
                    coordinates: result.coordinates
                };
            }
        } catch (error) {
            console.error('Failed to get country for IP:', ip, error);
        }
    }

    var formattedCountryData = transformCountryData(countryData);
    
    return formattedCountryData;
    
}
function transformCountryData(countryData) {
    var formattedArray = [];

    for (let country in countryData) {
        if (countryData.hasOwnProperty(country)) {
            if (country && countryData[country].coordinates && countryData[country].coordinates.lat !== undefined && countryData[country].coordinates.lon !== undefined) {
                // Combine the country name and count to form the new name
                let name = `${country}, ${countryData[country].count}`;
                // Extract coordinates and format them as an array [lat, lon]
                let coords = [
                    countryData[country].coordinates.lat,
                    countryData[country].coordinates.lon
                ];
                // Create an object with the required structure
                let entry = {
                    coords: coords,
                    name: name
                };
                // Add the formatted object to the array
                formattedArray.push(entry);
            }
        }
    }

    return formattedArray;
}
function getCountry(ip) {
    // Regex pattern to check if the input is a valid IPv4 address
    const ipRegex = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

    // Check if 'ip' is a valid IPv4 address
    if (ipRegex.test(ip)) {
        const data = processIP(ip);
        // Return both country and coordinates
        return {
            country: data.country,
            coordinates: data.coordinates 
        };
    } else {
        return {
            country: "Unknown",
            coordinates: { lat: null, lon: null }
        };
    }
    
};
function processIP(ipAddress) { 
    const geo = geoip.lookup(ipAddress);
    const ipData = {
        ipAddress: ipAddress,
        country: geo ? geo.country : '',
        region: geo ? geo.region : '',
        city: geo ? geo.city : '',
        coordinates: {
            lat: geo ? geo.ll[0] : '',
            lon: geo ? geo.ll[1] : ''
        }
    };
    return ipData;
};
// ************ //
/* END GeoLocated data */
// ************ //


// Proxy to handle Map requests
app.post('/getGeoData', (req, res) => {
    //const inputData = req.body.data || [];
    const inputData = req.body;
    const result = parseGeoData(inputData);
    console.log(result);
    res.json({ received: result });
});

// Proxy to handle API calls
app.get('/api/data', async (req, res) => {
    try {
        const apiResponse = await axios.get(process.env.API_URL, {
            headers: {
                'accept': process.env.ACCEPT_HEADER,
                'x-api-key': process.env.API_KEY,
                'Connection': 'keep-alive'  // Set Connection to keep-alive
            }
        });

        const dataString = JSON.stringify(apiResponse.data);
        const filePath = path.join('static/data/', 'apiData.json');
        
        fs.writeFile(filePath, dataString, err => {
            if (err) {
                console.error('Failed to save data to file:', err);
                return res.status(500).json({ message: 'Failed to save data to file' });
            }
            console.log('Data saved to file successfully.');
        });

        res.json(apiResponse.data);
    } catch (error) {
        console.error('Failed to fetch data:', error);
        res.status(500).json({ message: 'Failed to fetch data' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

axios.defaults.headers.common['Connection'] = 'keep-alive'