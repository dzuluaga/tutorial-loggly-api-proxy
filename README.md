<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**  *generated with [DocToc](https://github.com/thlorenz/doctoc)*

- [tutorial-loggly-api-proxy](#tutorial-loggly-api-proxy)
      - [1. How to deploy this API Proxy](#1-how-to-deploy-this-api-proxy)
      - [2. Enabling Winston](#2-enabling-winston)
      - [3. Configurating config-logger.js](#3-configurating-config-loggerjs)
      - [4. How to test it](#4-how-to-test-it)
      - [5. Throwing an explicit exception](#5-throwing-an-explicit-exception)
      - [6. Generate an exception by Reference Error](#6-generate-an-exception-by-reference-error)
      - [7. How to setup Express to catch unhandled exceptions (error-handling middleware)](#7-how-to-setup-express-to-catch-unhandled-exceptions-error-handling-middleware)
      - [8. Check entries in Loggly](#8-check-entries-in-loggly)
      - [9. Leveraging dynamic values from Apigee Vault or KVMs](#9-leveraging-dynamic-values-from-apigee-vault-or-kvms)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

# Api Proxies Logging push model with Cloud Vendors - Loggly
This tutorial provides a reference architecture for enabling APIs with Logging push model by leveraging Log Management Services such as Loggly, Papertrail, Raygun, etc. As mentioned above, the model described in this guide is based on the PUSH or POST model, in which API Proxies directly push logs to the log management platform. Apigee also provides out-of-the-box Node.js Logs capabilities to temporarily save logs, which can be retrieved by third party solutions under PULL model. However, for the sake of keeping this guide tight, this topic is out of the scope of this tutorial. So, stay tuned to learn more about the pull model in a separate article. For more information about these models and log management in general, take a look at [Logging and Log Management](http://shop.oreilly.com/product/9781597496353.do).

![Log Management for Modern APIs](./images/Log_Management_for_Modern_APIs.png)

In the previous diagram, an API Proxy in Apigee leverages a Log Management solution to log events. Apigee API Proxies can leverage standard Node.js libraries such as [Winston](https://github.com/winstonjs/winston) or [Bunyan](https://github.com/trentm/node-bunyan) to log entries in an async fashion, so there's little impact on latency.

#### 1. How to deploy this API Proxy
We will be leveraging [apigeetool](https://www.npmjs.com/package/apigeetool) to bundle and deploy it to Apigee Edge. You'll need to sign up for a Free Apigee Edge account [here](https://accounts.apigee.com/accounts/sign_up).

```bash
apigeetool deploynodeapp --username $ae_username --password $ae_password --organization testmyapi --api tutorial-loggly-api-proxy --environment test --directory . -m app.js -b /tutorial-loggly-api-proxy -U
```

#### 2. Enabling llbean-winston-logger Module
All steps included in this how-to-guide are standard to Winston configuration available [here](https://github.com/winstonjs/winston), including (Winston-Loggly)[https://github.com/winstonjs/winston-loggly], which is a Winston transporter for Loggly. So, there's nothing specific about Apigee to support it, except that Apigee requires importing Node.js Apps as Apigee API Proxy bundles, which is explained in How to deploy this API Proxy section.

Leverage llbean-winston-logger from a Node.js app by adding this dependency:
```bash
npm install llbean-winston-logger --save
```
**This API proxy contains a dependency to llbean-winstologger module, which can be resolved by following the recommendation from [this repo](https://github.com/llbeaninc/llbean-winston-logger), also note that -U flag will upload modules.**

#### 3. Configurating config-logger.js transports
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

__Note that you can declare multiple transporters. This provides the benefit of logging in multiple resources and apply different models (push or pull) to retrieve data from them, depending on the characteristics of requirements for logging.__

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

``` /pets?error=code_raised ``` will raise an exception by explicitly throwing the exception and ``` /pets?error=reference ``` will raise a reference error.

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

![Loggly Dashboard](./images/Loggly_Dashboard.png)

#### 9. Leveraging dynamic values from Apigee Vault or KVMs
The goal is to enable each API proxy with configuration that can be changed during runtime. In this way DevOps can switch configuration without having to redeploy the API proxy. For instance switching debug level from info to debug is a matter of switching the configuration from a common location such as an Apigee Vault or a KVM entry. These changes can be applied through the file /config/config-logger.js, e.g. ```"token": apigee.getVariable(req, 'LOGGER_LOGGLY_TOKEN') || "XXXXX-XXXXX-XXXX-XXXXX"```.