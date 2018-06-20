# mokd

> Programmable fake APIs server.

<!-- TOC -->

- [Requirements](#requirements)
- [Installation](#installation)
- [Usage](#usage)
    - [Usage as an express/connect middleware](#usage-as-an-expressconnect-middleware)
    - [Usage as a koa middleware](#usage-as-a-koa-middleware)
    - [Create your own adapter](#create-your-own-adapter)
- [Endpoint Configuration](#endpoint-configuration)
    - [Endpoint properties](#endpoint-properties)
        - [The `params` object](#the-params-object)
    - [Path Matching Formats and `$routeMatch`](#path-matching-formats-and-routematch)
    - [Endpoint response template](#endpoint-response-template)
    - [Endpoint Base URL](#endpoint-base-url)
    - [Examples](#examples)
- [Params interceptors](#params-interceptors)
- [Response transformers](#response-transformers)
        - [`transformJSON`](#transformjson)
        - [`transformText`](#transformtext)
- [Development Mode](#development-mode)
    - [Options](#options)
    - [Methods](#methods)
- [Contributing](#contributing)
- [Credits](#credits)
- [License](#license)

<!-- /TOC -->

## Requirements

* Node.js >=8.9.0 (we strongly suggest to use something like [nvm](https://github.com/creationix/nvm))
* npm or [yarn](https://yarnpkg.com/lang/en/)

## Installation

```
npm install mokd --save
```

## Usage

```js
const { Server }  = require('mokd');

const server = new Server({
  baseUrl: '', //optional
  endpoints: [
    {
      path: '/user/',
      response: {
        id: 1
        name: 'John Doe'
      }
      //... more endpoints configuration here, see below
    }
  ]
});

const { data } = server.resolve({ url: '/user/' });
//data === { "id": 1, "name": "John Doe" }
```

### Usage as an express/connect middleware

In order to use the server with an existing connect/express application you need to use the built-in adapter.

```js
const express = require('express');
const { Server, connectServer }  = require('mokd');

const server = new Server({
  baseUrl: '', //optional
  endpoints: [
    //... endpoints configuration object here, see below
  ]
});

const app = express();

app.use(connectServer(server));
app.listen(8000);
```

### Usage as a koa middleware

In order to use the server with an existing koa application you need to use the built-in adapter.

```js
const Koa = require('koa');
const { Server, koaServer }  = require('mokd');

const server = new Server({
  baseUrl: '', //optional
  endpoints: [
    //... endpoints configuration object here, see below
  ]
});

const app = new Koa();

app.use(koaServer(server));
app.listen(8000);
```

### Create your own adapter

If you're using another application framework, you can create a custom adapter. Refer to the built-in [koa](./lib/koa.js) or [connect](./lib/connect.js) for example implementations.

## Endpoint Configuration

The core of the server is the `endpoints` configuration option.

You can provide either an array of endpoints or a function returning an array of endpoints. In the latter case the function receives the server instance as first argument.

```js
const { Server }  = require('mokd');

//endpoints as array
const server = new Server({
  endpoints: [
    //... endpoints configuration object here, see below
  ]
});

const otherServer = new Server({
  endpoints: (srv) => [
    // you can access instance configuration here via `srv.options`
    //... endpoints configuration object here, see below
  ]
});
```

### Endpoint properties

Endpoints are objects with the following properties:

* `method` (`string`): The expected methods of the incoming request (default: `GET`),
* `path` (`string|regexp|function`): the path to match relative to the root URL. If a function it must return a string or a regular expression (default: `null`),
* `delay` (`number|function`): force a delay in milliseconds for the response. If a function it must return a number (default: `0`),
* `contentType` (`string`): Response content type (default: `application/json`),
* `response` (`*|function`): Response body template. Could be any type of content in relation to the `ContentType` parameter. If a function it will be executed with a `params` object and the `endpoint` itself as arguments. (default: `null`)

#### The `params` object

The `params` object contains 3 properties:

* `$req`: the original request object
* `$parsedUrl`: The request URL parsed by NodeJS native `url.parse` method
* `$routeMatch`: either an object (when `path` is a string) or an array of matched segments (when `path` is a regular expression). See below for details.


### Path Matching Formats and `$routeMatch`

Endpoint's `path` configuration could be a plain string, a regular expression or a string with Express-like parameters (see [path-to-regexp](https://www.npmjs.com/package/path-to-regexp) for details).
`$routeMatch` format will vary based on the provided `path`:

* regular expression: `$routeMatch` will be the resulting array of calling `RegExp.prototype.exec` on it
* string or Express-like route: `$routeMatch` will be and object with named parameters as keys. Note that even numeric parameters will be strings.

Examples:

```js
/* Plain string */
{
  path: '/api/v1/users'
  // /api/v1/users/ -> $routeMatch === {}
}

/* Express-like path */
{
  path: '/api/v1/users/:id'
  // /api/v1/users/10 -> $routeMatch === {id: '10'}
}

/* RegExp */
{
  path: /^\/api\/v1\/users\/(\d+)$/
  // /api/v1/users/10 -> $routeMatch === ['/api/v1/users/10', '10']
}
```

### Endpoint response template

Any key in the response template could be either a plain value or a function. If a function, it will be executed at response time with a [`params`](#the-params-object) object and the `endpoint` itself as arguments.

### Endpoint Base URL

The `baseUrl` configuration option sets up a base URL for every relative endpoint path provided. To override the base URL use absolute URLs.

*Note: `baseUrl` applies just to string paths.*

```js
const server = new Server({
  baseUrl: '/api/v1/', //optional
  endpoints: [
    {
      // this endpoint will respond at /api/v1/users
      path: 'users',
      response: {
        // ...
      }
    }, {
      // this endpoint will respond at /custom/path
      path: '/custom/path',
      response: {
        // ...
      }
    }
  ]
});
```

### Examples

1) A basic GET endpoint returning a JSON object

```js
const endpoint = {
  path: '/api/v1/user',
  response: {
    name: 'John',
    surname: 'Doe'
  }
};
```


2) A GET endpoint returning dynamic data provided by [Chance](http://chancejs.com/)

```js

const chance = require('chance').Chance();

const endpoint = {
  path: '/api/v1/user',
  response: {
    name: () => chance.first(),
    surname: () => chance.last()
  }
};
```

3) A GET endpoint matching a regexp and returning a dynamic property based on the match

```js

const chance = require('chance').Chance();

const endpoint = {
  //matches either a male of female user request
  path: /\/api\/v1\/user\/(male|female)$/,
  response: {
      name: (params) => chance.first({
        gender: params.$routeMatch[1]
      }),
      surname: (params) => chance.last({
        gender: params.$routeMatch[1]
      })
  }
};
```

4) A GET endpoint matching a regexp and returning a dynamic response based on the match

```js

const chance = require('chance').Chance();

const endpoint = {
  path: '/api/v1/:frag',
  response: (params) => {
    //calling /api/v1/user
    //params.$routeMatch === {'frag': 'user'}
    if (params.$routeMatch.frag === 'user') {
      return {
        name: () => chance.first(),
        surname: () => chance.last()
      };
    }

    return {
      error: 'Not matching anything'
    };
  }
};
```

5) A POST endpoint, accepting a body request and returning a success message

_Note:_ to parse the request body you usually need to enable body parsing in your application (in express / connect you can use [body-parser](https://github.com/expressjs/body-parser)).

```js
const endpoint = {
  path: '/api/v1/send',
  method: 'POST',
  response: (params) => {
    if (!params.$req.body.username || !params.$req.body.password) {
      return {
          success: false,
          msg: 'You must provide a username and a password'
      };
    }

    return {
      success: true,
      msg: 'Succesfully logged in!'
    };
  }
};
```

## Params interceptors

The [params](#the-params-object) object is automatically generated by the server. Anyway you can manipulate it by providing an array of interceptor functions as the `interceptors` key of the server configuration.

Every interceptor function receives the params object filtered by the previous interceptor.

```js
const addCustomKey = (params) => Object.assign(params, { keyID: 'my-custom-id' });
const addIfKey = (params) => Object.assign(params, params.keyID && { someData: '...' });

const server = new Server({
  interceptors: [
    addCustomKey,
    addIfKey
  ]
});
```

## Response transformers

You can instruct the server on which data format it has to provide for each endpoint's `contentType` with _response transformers_.

Response transformers are functions that take in 3 arguments and return formatted data (usually stringified in order the be a valid server response).

The arguments are:

* `data`: raw data object generated by the `response` property of the endpoint. Note that at this point dynamic response fields have not been yet been processed
* `endpoint`: matched endpoint for the request
* `params`: param object as used in the `response` property of the endpoint

An array of transform functions can be set as a `transformers` key in the `Server` configuration. The server will iterate on every transformer until it encounters one that doesn't return `undefined`.

By default the server comes with two built-in transformers:

#### `transformJSON`

Resolves any dynamic response template key and returns a stringified JSON object.

It's an high order function that takes a JSON stringifier function as first argument (defaults to `JSON.stringify`).

```js
const { Server } = require('mokd');
const { transformJSON } = require('mokd/lib/utils');

cost server = new Server({
  endpoints: [ ... ],
  transformers: [
    transformJSON()
  ]
});
```

#### `transformText`

Returns a string representation of the data provided by the endpoint's response.

```js
const { Server } = require('mokd');
const { transformText } = require('mokd/lib/utils');

cost server = new Server({
  endpoints: [ ... ],
  transformers: [
    transformText
  ]
});
```

## Development Mode

Mocked data could change frequently during development. Instead or restarting your application, you can instantiate a _watcher_ that will listen for file changes and reload  endpoints automatically.

In order for the watcher to work correctly you need to move the endpoints configuration to its own file and pass its path to the watcher.

```js
// endpoints.js
module.exports = [{
  path: 'api/users/'
  response {
    // ...
  }
}];

// server.js
const { createWatcher, Server } = require('../index');

const server = new Server(); // <-- don't pass endpoints here

const watcher = createWatcher({
  server,
  entrypoint: './endpoints.js'
  paths: ['./mocks/**/*.*'] //additional paths to watch
});

watcher.start();
```

### Options

`createWatcher` config object as the following options:

* `server`: A mock server instance
* `cwd`: (default: `process.cwd()`) The base directory from which relative paths are resolved.
* `entrypoint`: A path to a file exposing a list of endpoints. Either absolute or relative to `cwd`
* `paths`: A list of files or patterns to be watched for changes (See [`chokidar.watch` `path` argument](https://github.com/paulmillr/chokidar#api) for details).
* `watchOptions`: [`chokidar.watch` options](https://github.com/paulmillr/chokidar#api). By default `ignoreInitial` is `true` and `cwd` has the same value as the `cwd` option here.

### Methods

`createWatcher` returned object has the following methods:

* `start`: runs the watcher.
* `close`: proxy to chockidar's [`close` method](https://github.com/paulmillr/chokidar#methods--events)
* `on`: proxy to chockidar's [`on` method](https://github.com/paulmillr/chokidar#methods--events)
* `update(clear = true)`: Loads a fresh copy of the `entrypoint` file and every watched file. To reload just the entrypoint set `clear` to `false`.
* `clearCache`: removes watched files from NodeJS module's cache.


## Contributing

1. Fork it or clone the repo
1. Install dependencies `npm install`
1. Run `npm start` to launch a development server
1. Code your changes and write new tests in the `tests` folder.
1. Ensure everything is fine by running `npm test` and `npm run eslint`
1. Push it or submit a pull request :D

## Credits

Created by Marco Solazzi

## License

[MIT](LICENSE)