// require('express');
const superagent = require('superagent');
const MOVIE_API_KEY = process.env.MOVIE_API_KEY;

function getMovies(req, res) {
    const url = `https://api.themoviedb.org/3/movie/popular?api_key=${MOVIE_API_KEY}&language=en-US`
    superagent.get(url)
        .then(result => {
            //return of movies
            res.status(200).send(result.body.results.map(movie => new Movie(movie))); //TODO filter this down
        })
        .catch(err => {
            // let user know we messed up
            res.status(500).send("Sorry, something went very wrong");
        });
};

module.exports = getMovies