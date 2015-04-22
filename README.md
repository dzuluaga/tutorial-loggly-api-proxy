# tutorial-loggly-api-proxy
This tutorial provides a reference architecture for enabling APIs with Logging by leveraging Log Management Services such as Loggly, Papertrail, Raygun, etc. Apigee provides Node.js Logs capabilities. However, this topic is out of the scope of this tutorial.

![Log Management for Modern APIs](https://www.dropbox.com/s/70g4kiyde2nwwt4/Log%20Management%20for%20Modern%20APIs.png?dl=1)

In the previous diagram, an API Proxy in Apigee leverages a Log Management solution to log events. Apigee API Proxies can leverage standard Node.js libraries such as [Winston](https://github.com/winstonjs/winston) or [Bunyan](https://github.com/trentm/node-bunyan) to log entries in an async fashion, so there's little impact on latency.

#### 1. How to deploy this API Proxy
We will be leveraging [apigeetool](https://www.npmjs.com/package/apigeetool) to bundle and deploy it to Apigee Edge. You'll need to sign up for a Free Apigee Edge account [here](https://accounts.apigee.com/accounts/sign_up).

```bash
$ apigeetool deploynodeapp --username $ae_username --password $ae_password --organization testmyapi --api tutorial-loggly-api-proxy --environment test --directory . -m app.js -b /tutorial-loggly-api-proxy
```

#### 2. Enabling Winston
All steps included in this how-to-guide are standard to Winston configuration available [here](https://github.com/winstonjs/winston), including (Winston-Loggly)[https://github.com/winstonjs/winston-loggly], which a Winston transporter for Loggly. So, there's nothing specific about Apigee to support it, except that Apigee requires importing Node.js Apps as Apigee API Proxy bundles, which is explained in How to deploy this API Proxy section.

#### 3. Configurating config-logger.js
config-logger.js contains transporters. In our case file, console, and loggly. More transporters can be added and configured using values from KVMs. See LOGGER_FILE_JSON. Notice that it is required a token in order to authenticate with Loggly. This token is included as part of the configuration. However, it can also be specified as a KVM entry. Please consult Loggly [official documentation](https://www.loggly.com/docs/customer-token-authentication-token/) for further information about retrieving customer token.

```javascript
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
                "json": apigee.getVariable(req, 'LOGGER_CONSOLE_JSON') === 'true',
                "colorize": true
              }),
              new Loggly({
                "subdomain": apigee.getVariable(req, 'LOGGER_LOGGLY_SUBDOMAIN') || "dzuluaga.loggly.com",
                "token": apigee.getVariable(req, 'LOGGER_LOGGLY_TOKEN') || "XXXXX-XXXXXX-XXXXXX-XXXXXXX",
                "tags": "pets" //tags set per API. Helpful to filter down results
              })
          ]
```

#### 4. How to test it
We will generate two types of exceptions. Custom and ReferenceError Exceptions. Use error parameter to raise this exception.

```javascript
app.get('/pets', function(req, res){
      logger.info('access to /pets resource');
      if(req.query.error === 'code_raised'){ // raised exception
        logger.error("Error raised by an exception");
        throw new Error("Raised by an exception!")
      }else if(req.query.error === 'reference'){ //invalid function
        foo();
      }
      res.json(pets);
});
```

```/pets?error=code_raised``` will raise an exception by explicitly throwing the exception and ```/pets?error=reference``` will raise a reference error.

#### 5. Throwing an explicit exception
This exception is raised by the following code in /pets route.

```bash
$ curl http://testmyapi-test.apigee.net/tutorial-loggly-api-proxy/pets?error=code_raised
$ curl http://{org}-{env}.apigee.net/tutorial-loggly-api-proxy/pets?error=code_raised
```
**Response:**
```javascript
{"message":"Woops! Looks like something broke!","type":"ERROR-0001","messageid":"rrt011ea_BTMm+ALU_RouterProxy-2-514155_1"}
```

#### 6. Generate an exception by Reference Error
Since foo function doesn't exist, a Reference Error exception will be generated.
```bash
$ curl http://testmyapi-test.apigee.net/tutorial-loggly-api-proxy/pets?error=reference
curl http://{org}-{env}.apigee.net/tutorial-loggly-api-proxy/pets?error=reference
```
**Response:**
```javascript
{"message":"Woops! Looks like something broke!","type":"ERROR-0001","messageid":"rrt17apigee_BTMini/M_RouterProxy-2-565998_1"}
```
**Note messageid as part of the response to consumer apps. This is helpful to narrow down issues from responses generated to the consumer apps.**

#### 7. How to setup Express to catch unhandled exceptions (error-handling middleware)
The following middleware is required to be added after all routes. For further details check [Express official documentation](http://expressjs.com/guide/error-handling.html).

```javascript
//app.js
app.use(function(err, req, res, next) {
  var messageid = apigee.getVariable(req, "messageid") || 'LOCAL';
  res.locals.logger.error("messageid : " + messageid + ' - ' + err + " - " + err.stack);
  res.status(500).json({message : "Woops! Looks like something broke!", "type" : "ERROR-0001", messageid: messageid});
});
```

#### 8. Check entries in Loggly
All entries will be available through Loggly Dashboard. Log entries are searchable by tags and messageid.

![Loggly Dashboard](https://www.dropbox.com/s/o9yd1zg7utcew5c/Loggly_Dashboard.png?dl=1)
