//var logger = require('./logger');
//var petsJSON = require('./pets.json');

module.exports = {
  getPets :  function(req, res){
    var logger = res.locals.logger;
    logger.info('access to /pets resource');
    if(req.query.error === 'code_raised'){ //exception generated raised
      logger.error("Error raised by an exception");
      throw new Error("Error raised by an exception!")
    }else if(req.query.error === 'reference'){
      foo();
    }
    res.json(petsJSON);
  }
}