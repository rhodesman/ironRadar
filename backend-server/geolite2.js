/***** SETUP GEOLite2 API Server *****/
const express = require('express');
const path = require('path');
const geoip = require('geoip-lite');

require('dotenv').config();


const appapi = express();

const {
    PORT = 3000,
  } = process.env;

// Path to the GeoLite2 database
const dbPath = path.join(__dirname, 'data', 'data/GeoLite2-City.mmdb');
geoip.startWatchingDataUpdate(dbPath, { watchForUpdates: true });

// Route to get geolocation data for an IP address
appapi.get('/api/geoip/:ip', (req, res) => {
    const ip = req.params.ip;
    const geo = geoip.lookup(ip);

    if (!geo) {
        return res.status(404).send('Geolocation data not found for the IP.');
    }
    console.log(geo);
    res.json({
        ip,
        country: geo.country,
        region: geo.region,
        city: geo.city,
        latitude: geo.ll[0],
        longitude: geo.ll[1]
    });
});

appapi.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

/***** END GeoLite2 API Server *****/