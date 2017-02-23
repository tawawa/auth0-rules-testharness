'use strict';

var expect = require('chai').expect;
var runInSandbox = require("./index");

var user = {
  "email": "richard.seldon@auth0.com",
  "email_verified": true,
  "name": "Richard Seldon",
  "given_name": "Richard",
  "family_name": "Seldon",
  "created_at": "2017-02-22T07:52:40.990Z",
  "last_login": "2017-02-23T10:00:27.900Z",
  "logins_count": 4
};

var context = {
  "clientID": "wWXS5rz3asdfdfkzbCXho3zNPNv77c",
  "clientName": "My Auth0 Client",
  "connection": "MY-DB",
  "connectionStrategy": "auth0",
  "protocol": "oidc-basic-profile",
  "stats": {"loginsCount": 5}
};

var configuration = {
  NAME: 'world'
};

var params = {
  timeout: 5,
  ca: '',
  tenant: 'demo-workshop',
  url: 'https://sandbox.it.auth0.com',
  token: '<TOKEN>'
};


describe('auth0-rules-testharness', function () {

  var ruleScript = `function (user, context, callback) {
  console.log('hello,', configuration.NAME);
  user.foo = "bar";
  callback(null, user, context);
}`;

  it('should console log "hello, world" - available in output array', function (done) {

    var callback = function (err, result, output, stats) {
      // console.log('output: ', output);
      expect(output[0]).to.equal('hello, world');
      done();
    };

    var args = [user, context, callback];
    runInSandbox(ruleScript, args, configuration, params);
  });

  it('should append attribute "foo" to user with value "bar" - available in result object', function (done) {

    var callback = function (err, result, output, stats) {
      // console.log('result: ', result);
      expect(result.foo).to.equal('bar');
      done();
    };

    var args = [user, context, callback];
    runInSandbox(ruleScript, args, configuration, params);
  });

});