'use strict';
// ======================================= add requrments =======================================

require('dotenv').config();
require('./client.js')
const express = require('express');
const cors = require('cors')
const app = express();
const superagent = require('superagent');
const client = require('./client');

//handelars
const movies = require('./routs/movies');

// ======================================= app config =======================================

const PORT = process.env.PORT;
const GEOCODE_API_KEY = process.env.GEOCODE_API_KEY;
const WEATHER_API_KEY = process.env.WEATHER_API_KEY;
const PARKS_API_KEY = process.env.PARKS_API_KEY;
const MOVIE_API_KEY = process.env.MOVIE_API_KEY;
const YELP_API_KEY = process.env.YELP_API_KEY;
app.use(cors())

// ======================================= routs =======================================

app.get('/location', getLocation);
app.get('/weather', getWeather);
app.get('/parks', getParks);
app.get('/movies', getMovies);
app.get('/yelp', getYelps);

// ======================================= Rout Handelars =======================================

function handelError(res) {
    return err => {
        //if intentional reject
        if (err == 'found in db') { return }
        // let user know we messed up
        res.status(500).send("Sorry, something went very wrong");
    };
}

function getLocation(req, res) {
    //get wanted city
    const cityName = req.query.city;

    //create sql qury
    const sqlSelect = 'SELECT * FROM location WHERE search_query=$1';
    const sqlArray = [cityName];

    //qurie db
    qureyDataBase(sqlSelect, sqlArray)
        .then(result => { ReturnFromDbIfValid(result, res) })
        .then(() => { getLocationApi(cityName, res) })
        .then(result => { SavetoDBAndSendToClinet(result, cityName, res) })
        .catch(handelError(res));
}

function qureyDataBase(sqlSelect, sqlArray) {
    return client.query(sqlSelect, sqlArray);
}

function ReturnFromDbIfValid(result, res) {
    //return if was in db
    if (result.rows.length > 0) {
        res.status(200).send(result.rows[0]);
        return Promise.reject('found in db');
    }
}

function getLocationApi(cityName, res) {
    //formal url
    const url = `https://us1.locationiq.com/v1/search.php?key=${GEOCODE_API_KEY}&q=${cityName}&format=json`;
    // get location data from external api
    return superagent.get(url)
}

function SavetoDBAndSendToClinet(result, cityName, res) {
    // Get location data
    const location = result.body[0];

    // create db querie settings
    const sqlInsert = 'INSERT INTO location (search_query, formatted_query, latitude, longitude) VALUES($1, $2, $3, $4)';
    const sqlInsertArray = [
        cityName,
        location.display_name,
        parseFloat(location.lat),
        parseFloat(location.lon)
    ];
    // save in the db
    client.query(sqlInsert, sqlInsertArray);
    //send result to client
    res.status(200).send(new Location(location, cityName));
}

function getWeather(req, res) {
    //get location data from api and serve up
    const lat = req.query.latitude;
    const lon = req.query.longitude;
    const url = `https://api.weatherbit.io/v2.0/forecast/daily?lat=${lat}&lon=${lon}&key=${WEATHER_API_KEY}`
    GetFromApi(url)
        .then(result => { ReturnFormatedWeather(res, result) })
        .catch(handelError(res));
}

function GetFromApi(url) {
    return superagent.get(url);
}

function ReturnFormatedWeather(res, result) {
    res.status(200).send(result.body.data.map(day => new Weather(day)));
}

function getParks(req, res) {
    //get park data from api and serve up
    const cityName = req.query.search_query;
    const url = `https://${PARKS_API_KEY}@developer.nps.gov/api/v1/parks?q=${cityName}&limit=10`
    GetFromApi(url)
        .then(result => { returnFormatedParks(res, result) })
        .catch(handelError(res));
}

function returnFormatedParks(res, result) {
    res.status(200).send(result.body.data.map(park => new Park(park)));
}

function getMovies(req, res) {
    const url = `https://api.themoviedb.org/3/movie/popular?api_key=${MOVIE_API_KEY}&language=en-US`
    GetFromApi(url)
        .then(result => { returnFormatedMovies(res, result); })//TODO filter this down
        .catch(handelError(res));
}

function returnFormatedMovies(res, result) {
    res.status(200).send(result.body.results.map(movie => new Movie(movie)));
}

function getYelps(req, res) {
    const offset = (req.query.page - 1) * 5
    const url = `https://api.yelp.com/v3/businesses/search?term=restaurant&limit=5&latitude=${req.query.latitude}&longitude=${req.query.longitude}&offset=${offset}`
    GetFromApi(url)
        .set('Authorization', 'Bearer ' + YELP_API_KEY)
        .then(result => { returnFormatedYelps(res, result) })
        .catch(handelError(res));
}

function returnFormatedYelps(res, result) {
    res.status(200).send(result.body.businesses.map(yelp => new Yelp(yelp)));
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

function Movie(obj) {
    this.title = obj.original_title,
        this.overview = obj.overview,
        this.average_votes = obj.vote_average,
        this.total_votes = obj.vote_count,
        this.image_url = `https://image.tmdb.org/t/p/w500/${obj.poster_path}`,
        this.popularity = obj.popularity,
        this.released_on = obj.release_date
}

function Yelp(obj) {
    this.name = obj.name,
        this.image_url = obj.image_url,
        this.price = obj.price,
        this.rating = obj.rating,
        this.url = obj.url
}

//catchall / 404
app.use('*', (request, response) => response.send('Sorry, that route does not exist.'));

// ======================================= start app =======================================

app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
