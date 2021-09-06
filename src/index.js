const settings = {
    baseUrl: process.argv[2]
};

const Node = require('./api/node.js');

const detectors = [
    require('./detectors/redundantAttestations.js'),
];

const reporter = require('./reporting/logReporter.js');
const node = new Node(settings);

callDetectors('start', node, reporter);

async function callDetectors(method, ...args) {
    detectors.forEach(async detector => {
        if (!detector.hasOwnProperty(method)) {
            return;
        }
        try {
            await detector[method](...args);
        } catch (error) {
            console.log("Detector error in method " + method, error);
        }
    });
}

async function poll() {
    callDetectors('poll');
}

setInterval(poll, 1000)