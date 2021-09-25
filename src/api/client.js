const got = require('got');

module.exports = function(settings) {
    return {
        async getBlock(slot) {
            return await got.get(settings.baseUrl + '/eth/v2/beacon/blocks/' + encodeURIComponent(slot)).json();
        },

        async getBlockRoot(slot) {
            const response = await got.get(settings.baseUrl + '/eth/v1/beacon/blocks/' + encodeURIComponent(slot) + '/root').json();
            return response.data.root;
        }
    };
};