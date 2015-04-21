var winston = require('winston');
var Loggly = require('winston-loggly').Loggly;

winston.emitErrs = false;

var logger = new winston.Logger({
    transports: [
        new winston.transports.File({
            level: 'info',
            filename: './all-logs.log',
            //handleExceptions: true,
            json: true,
            maxsize: 5242880, //5MB
            maxFiles: 5,
            colorize: false,
        }),
        new winston.transports.Console({
            level: 'info',
            //handleExceptions: true,
            json: false,
            colorize: true,
        }),
        new Loggly({
          "subdomain": "dzuluaga.loggly.com",
          "token": "bafc53eb-45b0-44b3-bde6-e026c5bed598",
          //"handleExceptions" : true,
        })
    ],
    exitOnError: false
})

module.exports = logger;
module.exports.stream = {
    write: function(message, encoding){
        logger.info(message);
    }
};
