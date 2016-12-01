## Mock API

> Express / Connect middleware for programmable fake APIs

## Installation

```
npm install connect-mock-api --save
```

## Usage as an express/connect middleware

Open `build/gulp-tasks/lib/middlewares.js`, initialize the module ad return in the middlewares array

```js
const mockApiMiddleware = require('mock-api').middleware;

module.exports = function  (/*options*/) {

    const mocks = mockApiMiddleware({
        endpoints: [
            //... endpoints configuration object here, see below
        ]
    });

    return [
        mocks
        //... other middlewares
    ];
};
```

### Endpoint Configuration

Endpoints are objects with the following properties:
 
* `method` (`string`): The expected methods of the incoming request (default: `GET`),
* `path` (`string|function`): the path to match relative to the root URL. If a function it must return a string (default: `null`),
* `delay` (`number|function`): force a delay in milliseconds for the response. If a function it must return a number (default: `0`),
* `contentType` (`string`): Response content type (default: `application/json`),
* `template` (`*|function`): Response body template. Could be any type of content in relation to the `ContentType` parameter. 
If a function it will be executed with a `params` object and the `endpoint` itself as arguments. (default: `null`)

_Note:_ The `params` object contains two property:

* `$req`: the original express / connect request object
* `$parsedUrl`: The request URL parsed by NodeJS native `url.parse` method
* `$routeMatch`: either a boolean (when `path` is a string) or an array of matched segments (when `path` is a regular expression)


### Endpoint response template

Any key in the response template could be either a plan value or a function. If a function, it will be executed at response time
with a `params` object and the `endpoint` itself as arguments.

_Note:_ The `params` object contains two property:

* `$req`: the original express / connect request object
* `$parsedUrl`: The request URL parsed by NodeJS native `url.parse` method
* `$routeMatch`: either a boolean (when `path` is a string) or an array of matched segments (when `path` is a regular expression)

### Examples

1) A basic GET endpoint returning a JSON object

```js
const enpoint = {
    path: '/api/v1/user',
    template: {
        name: 'John',
        surname: 'Doe'
    }
};
```


2) A GET endpoint returning a dynamic data provided with [Chance](http://chancejs.com/)

```js

const chance = require('mock-api/lib/utils').chance;

const enpoint = {
    path: '/api/v1/user',
    template: {
        name: () => chance.first(),
        surname: () => chance.last()
    }
};
```

3) A GET endpoint matching a regexp and returning a dynamic property based on the match

```js

const chance = require('mock-api/lib/utils').chance;

const enpoint = {
    //matches either a male of female user request
    path: /\/api\/v1\/user\/(male|female)$/,
    template: {
        name: (params) => chance.first({ 
            gender: params.$routeMatch[1]
        }),
        surname: (params) => chance.last({ 
            gender: params.$routeMatch[1]
        })
    }
};
```


4) A GET endpoint matching a regexp and returning a dynamic template based on the match

```js

const chance = require('mock-api/lib/utils').chance;

const enpoint = {
    path: /\/api\/v1\/([a-z]+)$/,
    template: (params) => {
        //calling /api/v1/user
        //params.$routeMatch === ["/api/v1/user", "user"]
        if (params.$routeMatch[1] === 'user') {
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

const enpoint = {
    path: '/api/v1/send',
    method: 'POST',
    template: (params) => {
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