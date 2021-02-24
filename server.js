'use strict';
//=============add requrments===========================================================================================

require('dotenv').config();
const express = require('express');
const cors = require('cors')
const app = express();
const superagent = require('superagent')

//=============app config==============================================================================

const PORT = process.env.PORT;
const GEOCODE_API_KEY = process.env.GEOCODE_API_KEY;
const WEATHER_API_KEY = process.env.WEATHER_API_KEY;
const PARKS_API_KEY = process.env.PARKS_API_KEY;
app.use(cors())

// =============routs===========================================================================================

app.get('/location', handelLocation);
app.get('/weather', handelWeather);
app.get('/parks', handelParks);

function handelLocation(request, response) {
    // format our url
    const cityName = request.query.city;
    const url = `https://us1.locationiq.com/v1/search.php?key=${GEOCODE_API_KEY}&q=${cityName}&format=json`;
    //get location data from external api
    superagent.get(url)
        .then(result => {
            //return locations if success
            response.status(200).send(new Location(result.body[0], cityName));
        })
        .catch(err => {
            // let user know we messed up
            response.status(500).send("Sorry, something went wrong");
        });
}

function handelWeather(request, response) {
    //get location data from api and serve up
    const lat = request.query.latitude;
    const lon = request.query.longitude;
    const url = `https://api.weatherbit.io/v2.0/forecast/daily?lat=${lat}&lon=${lon}&key=${WEATHER_API_KEY}`
    superagent.get(url)
        .then(result => {
            //return list of weather
            response.status(200).send(result.body.data.map(day => new Weather(day)));
        })
        .catch(err => {
            // let user know we messed up
            response.status(500).send("Sorry, something went very wrong");
        });
}

function handelParks(request, response) {
    //get park data from api and serve up
    const state = request.query.formatted_query.split(', ')[2]
    const url = `https://${PARKS_API_KEY}@developer.nps.gov/api/v1/parks?q=${state}&limit=10`
    superagent.get(url)
        .then(result => {
            //return list of weather
            response.status(200).send(result.body.data.map(park => new Park(park)));
        })
        .catch(err => {
            // let user know we messed up
            response.status(500).send("Sorry, something went very wrong");
        });
}

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

//=============start app===========================================================================================

app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
