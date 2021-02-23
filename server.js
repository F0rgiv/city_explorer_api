'use strict';
//=============add requrments===========================================================================================

require('dotenv').config();
const express = require('express');
const cors = require('cors')
const app = express();

//=============app config==============================================================================

const PORT = process.env.PORT;
app.use(cors())

// =============routs===========================================================================================

app.get('/location', handelLocation);
app.get('/weather', handelWeather);


function handelLocation(request, response) {
    //get location data from file and serve up
    const locationData = require('./data/location.json')
    response.status(200).send(new Location(locationData[0], request.query.city))
}

function handelWeather(request, response) {
    //get location data from file and serve up
    const weatherData = require('./data/weather.json')
    //list of weather
    const returnData = []
    weatherData.data.forEach(day => {
        returnData.push(new Weather(day))
    })
    response.status(200).send(returnData);
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
