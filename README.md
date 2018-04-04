# What is it?

The *auth0-rules-testharness* library provides an easy way to deploy, execute, and test the output of Auth0 Rules using a real
webtask sandbox environment. It is very simple to use, and requires under 5 minutes to get started testing your Auth0 Rules! 

This README offers full instructions. However, for an easy to understand seed project that helps users get started immediately, please see [auth0-rules-testharness-sample](https://github.com/tawawa/auth0-rules-testharness-sample).

See here for further documentation on [Auth0 Rules](https://auth0.com/docs/rules).

Depending on your needs there are several pragmatic ways to test Rules without resorting to actually deploying and executing
them in a webtask sandbox environment. One solution is to use the [webtask runtime](https://github.com/auth0/webtask-runtime).
Doing this offers a series of components that replicate the behaviour of the runtime component of https://webtask.io.

However, sometimes you just want to execute your Rule against the same sandbox environment it will be deployed to at Runtime in
Auth0, and test everything works as expected. You may also wish to write your Rules using a test driven development approach, and gain real feedback as you code - this is where this npm module can help.  It actually takes your Rule script, and any `user`, `context` and `callback` you give it, then spins up a webtask, executes your Rule passing the results to the provided callback, and finally tears the environment down again.

### Notes

It is worth noting that under the covers, the script this npm module generates for deployment to a webtask environment depends upon [auth0-authz-rules-api](https://github.com/auth0/auth0-authz-rules-api). If you wish to study and understand the generated script code that wraps the Rule being tested, then this is the place to look ;)

For a similar NPM module to deploy, execute, and test the output of [Auth0 Custom DB](https://auth0.com/docs/connections/database/mysql) Scripts using a real webtask sandbox environment, please see [auth0-custom-db-testharness](https://www.npmjs.com/package/auth0-custom-db-testharness).

## Prerequisites 

Assumes you have an Auth0 Tenant webtask container to run your Rules against.

#### Create a free Auth0 Account

1. Go to [Auth0](https://auth0.com/signup) and click Sign Up.
2. Use Google, GitHub or Microsoft Account to login.

#### What is Auth0?

See bottom of this README for further info...


## How to use it? 

Just install it as an npm dependency and reference in your testsuite.

```bash
$ npm install auth0-rules-testharness
```

Below is a complete testsuite illustrating how you might go about using this library.
Please note, the `user` and `context` can be as lightweight or as realistic as you wish according to your test needs.

You can get your webtask token from [your auth0 dashboard](https://manage.auth0.com/#/account/webtasks)

It is referenced in Step 2. 


```
'use strict';

var expect = require('chai').expect;
var runInSandbox = require("auth0-rules-testharness");

var user = {
  "email": "richard.seldon@auth0.com",
  "email_verified": true,
  "name": "Richard Seldon"
};

var context = {
  "clientID": "wWXS5rz3asdfdfkzbCXho3zNPNv77c",
  "clientName": "My Auth0 Client",
  "connection": "MY-DB"
};

var configuration = {
  NAME: 'world'
};

var params = {
  timeout: 5,
  ca: '',
  tenant: 'my-super-tenant',
  url: 'https://sandbox.it.auth0.com',
  token: '<webtask-token>'
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
      // console.log('result.user: ', result.user);
      // console.log('result.context: ', result.context);
      expect(result.user.foo).to.equal('bar');
      done();
    };

    var args = [user, context, callback];
    runInSandbox(ruleScript, args, configuration, params);
  });

});
```

Above, hopefully everything is reasonably self-documenting if you are already familiar with Auth0 Rules. The signature of a rule is as follows:

```
function (user, context, callback) {
  // TODO: implement your rule
  callback(null, user, context);
}
```

As you can see, we need to provide a `user`, `context` and `callback`.

This library allows the end-user to offer any `user` or `context` objec they want, and expects any Tests you want to run on the results to be in the `callback` function.

The `configuration` object can contain any special configuration constants you may have. For example, testing your rule when it expects an API endpoint etc.

The `params` object takes a set of expected attribute values

```
var params = {
  timeout: 5,
  ca: '',
  tenant: 'my-super-tenant',
  url: 'https://sandbox.it.auth0.com',
  token: '<webtask-token>'
};
```

*Params Attributes Description*

* `timeout`: refers the timeout in seconds for the webtask to execute.
* `ca`: you can just leave as empty string.
* `tenant`: your tenant name in Auth0 
* `url`: sandbox container url - 'https://sandbox.it.auth0.com' for public cloud
* `token`: the webtask token. You can get your webtask token from [your auth0 dashboard](https://manage.auth0.com/#/account/webtasks).

That is it! You should be up and running in under 5 minutes with an easy way to execute and test your Rules against a webtask sandbox environment.

## Special Warning

It is possible that if one Rule fails due to malformed Script content, it could bring down the Webtask Container for a short period of time, affecting any other webtasks deployed in the same container. For this reason, usage of this library against a PRODUCTION webtask environment is strongly discouraged. 

Please note this is not a limitation of this library, but rather do with the behaviour of webtasks themselves - this is identical behaviour to writing a malformed Rule in the Auth0 Dashboard and executing it with an authentication request. Please see here for more information on [webtasks](https://webtask.io/), the underlying technology that Auth0 Rules are based upon.

## What is Auth0?

Auth0 helps you to:

* Add authentication with [multiple authentication sources](https://docs.auth0.com/identityproviders), either social like **Google, Facebook, Microsoft Account, LinkedIn, GitHub, Twitter, Box, Salesforce, among others**, or enterprise identity systems like **Windows Azure AD, Google Apps, Active Directory, ADFS or any SAML Identity Provider**.
* Add authentication through more traditional **[username/password databases](https://docs.auth0.com/mysql-connection-tutorial)**.
* Add support for **[linking different user accounts](https://docs.auth0.com/link-accounts)** with the same user.
* Support for generating signed [Json Web Tokens](https://docs.auth0.com/jwt) to call your APIs and **flow the user identity** securely.
* Analytics of how, when and where users are logging in.
* Pull data from other sources and add it to the user profile, through [JavaScript rules](https://docs.auth0.com/rules).

## Create a free Auth0 Account

1. Go to [Auth0](https://auth0.com/signup) and click Sign Up.
2. Use Google, GitHub or Microsoft Account to login.

## Issue Reporting

If you have found a bug or if you have a feature request, please report them at this repository issues section. Please do not report security vulnerabilities on the public GitHub issue tracker. The [Responsible Disclosure Program](https://auth0.com/whitehat) details the procedure for disclosing security issues.

## Author

[Auth0](auth0.com)

## License

This project is licensed under the MIT license. See the [LICENSE](LICENSE) file for more info.
