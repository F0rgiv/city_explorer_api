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
app.use(cors())

// =============routs===========================================================================================

app.get('/location', handelLocation);
app.get('/weather', handelWeather);

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
        console.log(result);
        //return list of weather
        response.status(200).send(result.body.data.map(day => new Weather(day)));
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

//catchall / 404
app.use('*', (request, response) => response.send('Sorry, that route does not exist.'));

//=============start app===========================================================================================

app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
