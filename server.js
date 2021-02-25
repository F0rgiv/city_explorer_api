'use strict';
// ======================================= add requrments =======================================

require('dotenv').config();
const express = require('express');
const cors = require('cors')
const app = express();
const superagent = require('superagent');
const pg = require('pg');

// ======================================= app config =======================================

const PORT = process.env.PORT;
const GEOCODE_API_KEY = process.env.GEOCODE_API_KEY;
const WEATHER_API_KEY = process.env.WEATHER_API_KEY;
const PARKS_API_KEY = process.env.PARKS_API_KEY;
app.use(cors())

const client = new pg.Client(process.env.DATABASE_URL);

// ======================================= routs =======================================

app.get('/location', getLocation);
app.get('/weather', getWeather);
app.get('/parks', getParks);


// ======================================= Rout Handelars =======================================

function getLocation(req, req) {
    // check sql
    const cityName = req.query.city;
    const sqlSelect = 'SELECT * FROM location WHERE search_query=$1';
    const sqlArray = [cityName];

    client.query(sqlSelect, sqlArray)
        .then(result => {
            //return if was in db
            if (result.rows.length > 0) {
                req.status(200).send(result.rows[0]);
            } else {
                // format our url
                const url = `https://us1.locationiq.com/v1/search.php?key=${GEOCODE_API_KEY}&q=${cityName}&format=json`;

                // get location data from external api
                superagent.get(url)
                    .then(result => {
                        // Get location data
                        const location = result.body[0];

                        // save in the db
                        const sqlInsert = 'INSERT INTO location (search_query, formatted_query, latitude, longitude) VALUES($1, $2, $3, $4)';
                        const sqlInsertArray = [
                            cityName,
                            location.display_name,
                            parseFloat(location.lat),
                            parseFloat(location.lon)
                        ];
                        client.query(sqlInsert, sqlInsertArray).then(result => {
                            // return locations if success
                            req.status(200).send(new Location(location, cityName));
                        });
                    })
                    .catch(err => {
                        // let user know we messed up
                        req.status(500).send("Sorry, something went wrong");
                    });
            }
        });
}

function getWeather(req, req) {
    //get location data from api and serve up
    const lat = req.query.latitude;
    const lon = req.query.longitude;
    const url = `https://api.weatherbit.io/v2.0/forecast/daily?lat=${lat}&lon=${lon}&key=${WEATHER_API_KEY}`
    superagent.get(url)
        .then(result => {
            //return list of weather
            req.status(200).send(result.body.data.map(day => new Weather(day)));
        })
        .catch(err => {
            // let user know we messed up
            req.status(500).send("Sorry, something went very wrong");
        });
}

function getParks(req, req) {
    //get park data from api and serve up
    const cityName = req.query.search_query;
    const url = `https://${PARKS_API_KEY}@developer.nps.gov/api/v1/parks?q=${cityName}&limit=10`
    superagent.get(url)
        .then(result => {
            //return list of weather
            req.status(200).send(result.body.data.map(park => new Park(park)));
        })
        .catch(err => {
            // let user know we messed up
            req.status(500).send("Sorry, something went very wrong");
        });
}

// ======================================= models =======================================

function Location(obj, city) {
    this.search_query = city,
        this.formatted_query = obj.display_name,
        this.latitude = obj.lat,
        this.longitude = obj.lon
}

function Weather(obj) {
    this.forecast = obj.weather.description,
        this.time = obj.datetime
}

function Park(obj) {
    this.name = obj.fullName,
        this.address = `${obj.addresses[0].line1} ${obj.addresses[0].city} ${obj.addresses[0].stateCode} ${obj.addresses[0].postalCode}`//"319 Second Ave S." "Seattle" "WA" "98104",
    this.fee = obj.entranceFees[0].cost,
        this.description = obj.description,
        this.url = obj.url
}

//catchall / 404
app.use('*', (request, response) => response.send('Sorry, that route does not exist.'));

// ======================================= start app =======================================

//connect to db
client.connect().then(() => {
    //start server
    app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
});