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
    response.send(new Location(locationData))
});


function Location(obj) {
    this.search_query = "",
    this.formatted_query = "",
    this.latitude = "",
    this.longitude = ""
}

//catchall / 404

app.use('*', (request, response) => response.send('Sorry, that route does not exist.'));

//strat app

app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
