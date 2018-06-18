const path = require('path');
const fs = require('fs');
const chance = require('chance').Chance();

module.exports = () => { //eslint-disable-line arrow-body-style

    return [{
        path: 'users/:id',
        response: (params) => {
            /**
             * Example response: use a static JSON as data base and add dynamic properties
             */
            const id = parseInt(params.$routeMatch.id, 10);
            return {
                id
            };
        }
    }, {
        path: 'number',
        response: {
            /**
             * Just dynamic data
             */
            number: () => chance.natural()
        }
    }, {
        path: '/list',
        response: [{
            name: 'John'
        }, {
            name: 'Jane'
        }]
    }, {
        //catche all
        path: /api\/(.+)/,
        response: (params) => {
            /**
             * Example template: use a static JSON as data base and add dynamic properties
             */
            const filepath = path.join(process.cwd(), 'fixtures', `${params.$routeMatch[1]}.json`);

            try {
                const data = JSON.parse(fs.readFileSync(filepath, { encoding: 'utf8' })) || {};
                return Object.assign(data || {}, {
                    gender: () => chance.gender()
                });
            } catch (e) {
                return {
                    error: true,
                    msg: e.toString()
                };
            }

        }
    }];

};