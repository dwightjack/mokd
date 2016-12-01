const path = require('path');
const fs = require('fs');

module.exports = (chance) => { //eslint-disable-line arrow-body-style

    return [{
        path: /api\/(.+)/,
        template: (params) => {
            /**
             * Example template: use a static JSON as data base and add dynamic properties
             */
            const filepath = path.join(process.cwd(), 'fixtures', `${params.$routeMatch[1]}.json`);
            const data = JSON.parse(fs.readFileSync(filepath, { encoding: 'utf8' })) || {};
            return Object.assign(data || {}, {
                gender: () => chance.gender()
            });
        }
    }, {
        path: '/test/',
        template: {
            /**
             * Just dynamic data
             */
            number: () => chance.natural()
        }
    }];

};