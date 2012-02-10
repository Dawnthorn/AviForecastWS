//
// Copyright (c) 2012 Sebnarware. All rights reserved.
//


//
// required packages
//

var winston = require('winston');
var express = require('express');
var gzippo = require('gzippo');
var fs = require('fs');
var forecasts = require('./forecasts.js');


//
// HTTP server
//

runServer();

function runServer() {

    configLogger();

    initializeForecastProcessing();

    startHTTPServer();
}

function configLogger() {
    // remove the default transport, so that we can reconfigure it
    winston.remove(winston.transports.Console);

    // verbose, info, warn, error are the log levels i'm using
    winston.add(winston.transports.Console, {level: 'info', handleExceptions: true});
}

function initializeForecastProcessing() {

    var regions = JSON.parse(fs.readFileSync(forecasts.REGIONS_PATH, 'utf8'));

    // generate the forecast content
    forecasts.aggregateForecasts(regions);

    // configure a timer to regenerate the forecast content on a recurring basis
    setInterval(forecasts.aggregateForecasts, forecasts.FORECAST_GEN_INTERVAL_SECONDS * 1000, regions);
}

function startHTTPServer() {

    var app = express.createServer();

    // set up the express middleware, in the order we want it to execute

    // enable web server logging; NOTE this is separate from the winston logging
    app.use(express.logger());
    // server static content, compressed
    app.use(gzippo.staticGzip(forecasts.STATIC_FILES_DIR_PATH, {clientMaxAge:(forecasts.CACHE_MAX_AGE_SECONDS * 1000)}));
    // handle errors gracefully
    app.use(express.errorHandler());

    // use the value from the PORT env variable if available, fallback if not
    var port = process.env.PORT || 5000;

    app.listen(port,
        function () {
            // NOTE if you don't get this log message, then the http server didn't start correctly;
            // check if another instance is already running...
            winston.info('server listening on port: ' + port);
        }
    );
}
































