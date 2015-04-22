var winston = require('winston');

var logger = function(transportOptions){
    var _logger = new winston.Logger(transportOptions);
    _logger.emitErrs = false;
    return _logger;
}

module.exports = logger;
module.exports.stream = {
    write: function(message, encoding){
        logger.info(message);
    }
};
