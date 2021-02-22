'use strict';
//add requrments

require('dotenv').config();
const express = require('express');
const cors = require('cors')
const app = express();

//app config

const PORT = process.env.PORT;
app.use(cors())

// routs

// return location info
app.get('/location', (request, response) => {
    const locationData = require('./data/location.json')
    response.send(new Location(locationData[0], request.query.city))
});

function Location(obj, city) {
    this.search_query = city,
    this.formatted_query = obj.display_name,
    this.latitude = obj.lat,
    this.longitude = obj.lon
}

//return weather info
app.get('/weather', (request, response) => {
    const weatherData = require('./data/weather.json')
    //list of weather
    const returnData = []
    weatherData.data.forEach(day => {
        returnData.push(new Weather(day))
    })
    response.send(returnData);
});

function Weather(obj) {
    this.forecast = obj.weather.description,
    this.time = obj.datetime
}

//catchall / 404

app.use('*', (request, response) => response.send('Sorry, that route does not exist.'));

//strat app

app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
