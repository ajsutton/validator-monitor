const got = require('got');

module.exports = function(settings) {
    return {
        async getBlock(slot) {
            return await got.get(settings.baseUrl + '/eth/v2/beacon/blocks/' + encodeURIComponent(slot)).json();
        }
    };
};