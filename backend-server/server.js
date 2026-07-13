// server/server.js
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const geoip = require('geoip-lite');
const { Parser } = require('json2csv');

require('dotenv').config();

var jsdom = require('jsdom');
const { JSDOM } = jsdom;
const { window } = new JSDOM();
const { document } = (new JSDOM('')).window;
global.document = document;

var $ = jQuery = require('jquery')(window);



// Load the GeoIP database
geoip.startWatchingDataUpdate(path.join(__dirname, 'data', 'data/GeoLite2-City.mmdb'), { watchForUpdates: true });
const app = express();
const PORT = process.env.PORT || 8888;
app.use(cors()); 

app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, '..', 'dashboard', 'static')));
app.use(bodyParser.urlencoded({ extended: true }));

// Set up multer for file uploads
app.use(bodyParser.json());


// ************ //
/* START GeoLocated processing */
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

    //var formattedCountryData = transformCountryData(countryData);
    
    //return formattedCountryData;

    return countryData;
    
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
    //console.log("processIP: " + ipData);
    return ipData;
};
// ************ //
/* END GeoLocated processing */
// ************ //

// Endpoint to handle JSON file upload and convert it to CSV
app.post('/convert-json', (req, res) => {
    const jsonData = req.body;

    // Log the received data for debugging
    console.log('Received JSON data');

    if (!Array.isArray(jsonData) || jsonData.length === 0) {
        return res.status(400).send('JSON data should contain an array of objects.');
    }

    try {
        const fields = Object.keys(jsonData[0]);
        const opts = { fields };
        const parser = new Parser(opts);
        const csv = parser.parse(jsonData);

        res.header('Content-Type', 'text/csv');
        res.attachment('IronRadarExport.csv');
        res.send(csv);
    } catch (err) {
        console.error('Error converting data to CSV:', err);
        res.status(500).send('Server Error');
    }
});

// Proxy to handle Map requests
app.post('/api/getGeoData', (req, res) => {

    const inputData = req.body;
    const result = parseGeoData(inputData);
    
    res.json({ received: result });

});

// Serve the bundled static threat snapshot (no external API)
app.get('/api/data', (req, res) => {
    const filePath = path.join(__dirname, '..', 'dashboard', 'static', 'data', 'root_30d.json');
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Failed to read local data file:', err);
            return res.status(500).json({ message: 'Failed to read local data file' });
        }
        res.type('application/json').send(data);
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
