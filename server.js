'use strict';
// ======================================= add requrments =======================================

require('dotenv').config();
require('./client.js')
const express = require('express');
const cors = require('cors')
const app = express();
const superagent = require('superagent');
const client = require('./client');

// ======================================= app config =======================================

const PORT = process.env.PORT;
const GEOCODE_API_KEY = process.env.GEOCODE_API_KEY;
const WEATHER_API_KEY = process.env.WEATHER_API_KEY;
const PARKS_API_KEY = process.env.PARKS_API_KEY;
app.use(cors())

// ======================================= routs =======================================

app.get('/location', getLocation);
app.get('/weather', getWeather);
app.get('/parks', getParks);
app.get('/movies', getMovies);
app.get('/yelp', getYelps);

// ======================================= Rout Handelars =======================================

function getLocation(req, res) {
    // check sql
    const cityName = req.query.city;
    const sqlSelect = 'SELECT * FROM location WHERE search_query=$1';
    const sqlArray = [cityName];

    client.query(sqlSelect, sqlArray)
        .then(result => {
            //return if was in db
            if (result.rows.length > 0) {
                res.status(200).send(result.rows[0]);
            }
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
                        res.status(200).send(new Location(location, cityName));
                    });
                })
                .catch(err => {
                    // let user know we messed up
                    res.status(500).send("Sorry, something went wrong");
                });
        });
}

function getWeather(req, res) {
    //get location data from api and serve up
    const lat = req.query.latitude;
    const lon = req.query.longitude;
    const url = `https://api.weatherbit.io/v2.0/forecast/daily?lat=${lat}&lon=${lon}&key=${WEATHER_API_KEY}`
    superagent.get(url)
        .then(result => {
            //return list of weather
            res.status(200).send(result.body.data.map(day => new Weather(day)));
        })
        .catch(err => {
            // let user know we messed up
            res.status(500).send("Sorry, something went very wrong");
        });
}

function getParks(req, res) {
    //get park data from api and serve up
    const cityName = req.query.search_query;
    const url = `https://${PARKS_API_KEY}@developer.nps.gov/api/v1/parks?q=${cityName}&limit=10`
    superagent.get(url)
        .then(result => {
            //return list of weather
            res.status(200).send(result.body.data.map(park => new Park(park)));
        })
        .catch(err => {
            // let user know we messed up
            res.status(500).send("Sorry, something went very wrong");
        });
}

function getMovies(req, res) {
    res.send([
        {
          "title": "Sleepless in Seattle",
          "overview": "A young boy who tries to set his dad up on a date after the death of his mother. He calls into a radio station to talk about his dad’s loneliness which soon leads the dad into meeting a Journalist Annie who flies to Seattle to write a story about the boy and his dad. Yet Annie ends up with more than just a story in this popular romantic comedy.",
          "average_votes": "6.60",
          "total_votes": "881",
          "image_url": "https://image.tmdb.org/t/p/w500/afkYP15OeUOD0tFEmj6VvejuOcz.jpg",
          "popularity": "8.2340",
          "released_on": "1993-06-24"
        },
        {
          "title": "Love Happens",
          "overview": "Dr. Burke Ryan is a successful self-help author and motivational speaker with a secret. While he helps thousands of people cope with tragedy and personal loss, he secretly is unable to overcome the death of his late wife. It's not until Burke meets a fiercely independent florist named Eloise that he is forced to face his past and overcome his demons.",
          "average_votes": "5.80",
          "total_votes": "282",
          "image_url": "https://image.tmdb.org/t/p/w500/pN51u0l8oSEsxAYiHUzzbMrMXH7.jpg",
          "popularity": "15.7500",
          "released_on": "2009-09-18"
        }
      ])
}

function getYelps(req, res) {
    res.send([
        {
          "name": "Pike Place Chowder",
          "image_url": "https://s3-media3.fl.yelpcdn.com/bphoto/ijju-wYoRAxWjHPTCxyQGQ/o.jpg",
          "price": "$$   ",
          "rating": "4.5",
          "url": "https://www.yelp.com/biz/pike-place-chowder-seattle?adjust_creative=uK0rfzqjBmWNj6-d3ujNVA&utm_campaign=yelp_api_v3&utm_medium=api_v3_business_search&utm_source=uK0rfzqjBmWNj6-d3ujNVA"
        },
        {
          "name": "Umi Sake House",
          "image_url": "https://s3-media3.fl.yelpcdn.com/bphoto/c-XwgpadB530bjPUAL7oFw/o.jpg",
          "price": "$$   ",
          "rating": "4.0",
          "url": "https://www.yelp.com/biz/umi-sake-house-seattle?adjust_creative=uK0rfzqjBmWNj6-d3ujNVA&utm_campaign=yelp_api_v3&utm_medium=api_v3_business_search&utm_source=uK0rfzqjBmWNj6-d3ujNVA"
        }
      ])
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

app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
