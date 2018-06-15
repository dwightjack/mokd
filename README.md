## Connect Mock API

> Express / Connect middleware for programmable fake APIs

## Installation

```
npm install connect-mock-api --save
```

## Usage as an express/connect middleware

```js
const express = require('express');
const mockApiMiddleware = require('connect-mock-api').middleware;

const app = express();

const mocks = mockApiMiddleware({
    baseUrl: '', //optional
    endpoints: [
        //... endpoints configuration object here, see below
    ]
});

app.use(mocks);
app.listen(8000);

```

### Endpoint Configuration

Endpoints are objects with the following properties:

* `method` (`string`): The expected methods of the incoming request (default: `GET`),
* `path` (`string|regexp|function`): the path to match relative to the root URL. If a function it must return a string or a regular expression (default: `null`),
* `delay` (`number|function`): force a delay in milliseconds for the response. If a function it must return a number (default: `0`),
* `contentType` (`string`): Response content type (default: `application/json`),
* `response` (`*|function`): Response body template. Could be any type of content in relation to the `ContentType` parameter.
If a function it will be executed with a `params` object and the `endpoint` itself as arguments. (default: `null`)

_Note:_ The `params` object contains 3 properties:

* `$req`: the original express / connect request object
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

Any key in the response template could be either a plan value or a function. If a function, it will be executed at response time
with a `params` object and the `endpoint` itself as arguments.

_Note:_ The `params` object contains two property:

* `$req`: the original express / connect request object
* `$parsedUrl`: The request URL parsed by NodeJS native `url.parse` method
* `$routeMatch`: either a boolean (when `path` is a string) or an array of matched segments (when `path` is a regular expression)

### Endpoint Base URL

The `baseUrl` configuration option sets up a base URL for every relative endpoint path provided. To override the base URL use absolute URLs.

*Note: `baseUrl` applies just to string paths.*

```js
const mocks = mockApiMiddleware({
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


2) A GET endpoint returning a dynamic data provided with [Chance](http://chancejs.com/)

```js

const chance = require('connect-mock-api/lib/utils').chance;

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

const chance = require('connect-mock-api/lib/utils').chance;

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

const chance = require('connect-mock-api/lib/utils').chance;

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

_Note:_ to parse the request body you should append [body-parser](https://github.com/expressjs/body-parser) middleware
 to the express / connect middleware list.

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