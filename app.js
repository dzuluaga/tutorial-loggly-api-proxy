var express = require('express'),
    app = express(),
    fs = require('fs'),
    apigee = require('apigee-access'),
    pets = require('./lib/petsController');
    petsJSON = require('./lib/pets.json'),
    config_logger = require('./config/config-logger.js');

function loadLogger(req, res, next){
  var logger = require('llbean-winston-logger');
  var logger = new logger(config_logger.getTransportOptions(req));
  res.locals.logger = logger;
  next();
}

app.get('/pets', loadLogger, pets.getPets);

app.use(function(err, req, res, next) {
  console.log(err.stack)
  var messageid = apigee.getVariable(req, "messageid") || 'LOCAL';
  res.locals.logger.error("messageid : " + messageid + ' - ' + err + " - " + err.stack);
  res.status(500).json({message : "Woops! Looks like something broke!", "type" : "ERROR-0001", messageid: messageid});
});

var server = app.listen(3000, function () {
  var host = server.address().address;
  var port = server.address().port;
  console.log('Example app listening at http://%s:%s', host, port);
});