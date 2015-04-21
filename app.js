var logger = require('./lib/logger'),
    express = require('express'),
    app = express(),
    fs = require('fs');
    pets = JSON.parse(fs.readFileSync('./lib/pets.json', 'utf8')),
    apigee = require('apigee-access');

app.get('/pets', function(req, res){
  logger.info('access to /pets resource');

  if(req.query.error === 'code_raised'){ //exception generated raised
    logger.error("Error raised by an exception");
    throw new Error("Error raised by an exception!")
  }else if(req.query.error === 'reference'){
    foo();
  }
	 res.json(pets);
});

app.use(function(err, req, res, next) {
  var messageid = apigee.getVariable(req, "messageid") || 'LOCAL';
  logger.error("messageid : " + messageid + ' - ' + err + " - " + err.stack);
  res.status(500).json({message : "Woops! Looks like something broke!", "type" : "ERROR-0001", messageid: messageid});
});

var server = app.listen(3000, function () {
  var host = server.address().address;
  var port = server.address().port;
  console.log('Example app listening at http://%s:%s', host, port);
});