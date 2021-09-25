
const events = require('./events.js');
const Api = require('./client.js');

module.exports = function(settings) {
    events.start(settings);
    return {
        events,
        api: new Api(settings),
        stop() {
            events.stop();
        }
    };
};