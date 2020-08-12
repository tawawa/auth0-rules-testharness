var assert = require('assert');
var cb = require('cb');
var ejs = require('ejs');
var request = require('request');
var winston = require('winston');

var sandbox_function_template = (function () {
  ;
  /*
   require('auth0-authz-rules-api').extend(global);
   return function (ctx, cb) {
     var console = _wrap_console();
     var configuration = <%- JSON.stringify(model.configuration) %>;
     var webtask = ctx;

     var resultAggregate = function(error, user, context) {
       if (error) { return cb(error); }
       return cb(error, { user: user, context: context});
     };

     (
       function (usr, ctx, cb) {
        var manipulator = function(error, user, context) {
          if(error) { return cb(error); }
          return cb(error, { user: user, context: context });
        };
        
        (<%- model.script %>)(usr, ctx, manipulator);
      }
     )(<%- model.args %>, _wrap_callback(cb, console));
   }
   */
}).toString().match(/[^]*\/\*([^]*)\*\/\s*\}$/)[1];

function runInSandbox(script, args, configuration, params) {

  var callback = args.slice(-1)[0];

  var argList = args
    .slice(0, -1)
    .map(function (arg) {
      return JSON.stringify(arg || '');
    }).join(', ');


  var code = ejs.render(sandbox_function_template, {
    model: {
      configuration: configuration || {},
      args: argList,
      script: script
    }
  });

  run();

  function run() {

    var options = {
      method: 'POST',
      url: params.url + '/api/run/' + params.tenant + '?webtask_share_token',
      headers: {
        Authorization: 'Bearer ' + (params.token || params.key)
      },
      timeout: params.timeout * 1000,
      ca: params.ca.length > 0 ? params.ca : undefined,
      body: code,
    };

    request(options, function (err, res, body) {

      if (err) {
        if (typeof err === 'object' && (err.code === 'ETIMEDOUT' || err.code === 'ESOCKETTIMEDOUT')) {
          return callback(new Error(params.timeout));
        }
        return callback(err);
      }

      if (res.statusCode === 429) {
        var backoff = (+res.headers['retry-after'] || 5) * 1000;
        backoff += Math.floor(Math.random() * backoff);
        winston.debug('scheduling retry of auth0-sandbox request', {
          backoff: backoff
        });
        setTimeout(run_once, backoff);
        return;
      }

      if (res.statusCode !== 200 && res.statusCode !== 500) {

        var errorMessage = 'Invalid response code from the auth0-sandbox: HTTP ' + res.statusCode + '.';
        var parsedBody = toJSON(body);

        if (parsedBody && parsedBody.error) {
          // Special error case: Script Error like a syntax error. The response has a status code of 500.
          errorMessage += ' ' + parsedBody.error;

          console.log('ADJUSTED ERROR MESSAGE', errorMessage);

          if (parsedBody.details) {
            errorMessage += ' ' + parsedBody.details;
          }
          return callback(new Error(errorMessage), undefined, parsedBody.stdout);
        } else {
          return callback(new Error(errorMessage), undefined, [body], null);
        }
      }

      var json = toJSON(body);
      if (!json || typeof json !== 'object') {
        return callback(new Error('Invalid response content from the auth0-sandbox: ' + body), undefined, [body], null);
      }

      if (json.message === 'Blocked event loop.') {
        var timeout_error = new Error(params.timeout, undefined, json.stdout, null);
        timeout_error.stack = json.stack;
        return callback(timeout_error, undefined, json.stdout, null);
      }

      if (json.error === 'Script generated an unhandled synchronous exception.') {
        var unhandledError = new Error(json.message);
        unhandledError.stack = json.stack;
        return callback(unhandledError, undefined, json.stdout, null);
      }

      if (json.error) {
        // callback is called with an error
        var parsed_error = typeof json.error === 'string' ? new Error(json.message || json.error) : json.error;
        parsed_error.fromSandbox = true;
        parsed_error.stack = json.stack;
        return callback(parsed_error, undefined, json.stdout, null);
      }

      return callback(null, json.result, json.stdout, null);

    });
  }
}

function toJSON(obj) {
  var json;
  try {
    json = JSON.parse(obj);
  } catch (e) {
    json = null;
  }
  return json;
}

module.exports = runInSandbox;
