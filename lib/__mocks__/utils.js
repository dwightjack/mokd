const utils = jest.genMockFromModule('../../lib/utils');

utils.transformJSON = () => jest.fn();

module.exports = utils;