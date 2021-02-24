# city_explorer_api

**Author**: James Mansour
**Version**: 1.1.0 (increment the patch/fix version number if you make more commits past your first submission)

## Overview
The pupose of this api is to surva data to the city explorer web app so that it is usfull to users.

## Getting Started
run
```
npm install to install requred dependancies.
Ensure you have the local env keys.
PORT =port
GEOCODE_API_KEY =<api_key>
WEATHER_API_KEY =<api_key>
PARKS_API_KEY =<api_key>
```

## Architecture
This application uses express to return get requests from https://codefellows.github.io/code-301-guide/curriculum/city-explorer-app/front-end/

## Change Log
02/21/2021 adds initial apis
/weather
    returns list of wether info
    ```[
        {
            "forecast": "Partly cloudy until afternoon.",
            "time": "Mon Jan 01 2001"
        },
        {
            "forecast": "Mostly cloudy in the morning.",
            "time": "Tue Jan 02 2001"
        },
        ...
    ]```
/location
    returns obj of location infomation:
    ```{
        "search_query": "seattle",
        "formatted_query": "Seattle, WA, USA",
        "latitude": "47.606210",
        "longitude": "-122.332071"
    }```


02/22/2021 adds park info
## Credits and Collaborations
<!-- Give credit (and a link) to other people or resources that helped you build this application. -->
-->