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
        .then(responce => {
            //return locations if success
            response.status(200).send(new Location(responce.body[0], cityName))
        })
        .catch(err => {
            //return errors if broken
        });
}

function handelWeather(request, response) {
    //get location data from file and serve up
    const weatherData = require('./data/weather.json')
    //list of weather
    response.status(200).send(weatherData.data.map(day => new Weather(day)));
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
