var apigee = require('apigee-access'),
    winston = require('winston'),
    Loggly = require('winston-loggly').Loggly;

module.exports = {
  getTransportOptions : function(req){
      return {
          transports : [
              new winston.transports.File({
                "level": "info",
                "filename": "./all-logs.log",
                "json": apigee.getVariable(req, 'LOGGER_FILE_JSON') === 'true',
                "maxsize": 5242880, //5 MB
                "maxFiles": 5,
                "colorize": false
              }),
              new winston.transports.Console({
                "level": "info",
                //**retrieve values from KVM or Apigee Vault
                "json": apigee.getVariable(req, 'LOGGER_CONSOLE_JSON') === 'true',
                "colorize": true
              }),
              new Loggly({
                "subdomain": apigee.getVariable(req, 'LOGGER_LOGGLY_SUBDOMAIN') || "dzuluaga.loggly.com",
                //**retrieve values from KVM or Apigee Vault
                "token": apigee.getVariable(req, 'LOGGER_LOGGLY_TOKEN') || "XXXXX-XXXXX-XXXX-XXXXX",
                "tags": "pets"
              })
          ],
         "handleExceptions" : true,
         "exitOnError": false
    }
  }
}