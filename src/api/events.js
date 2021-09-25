const EventSource = require('eventsource');

module.exports = {
    start(settings) {
        this.eventSource = new EventSource(settings.baseUrl + '/eth/v1/events?topics=head,block,chain_reorg');
        this.eventSource.onerror = err => console.error("Event stream failed", err);
    },

    stop() {
        this.eventSource.close();
    },

    subscribe(eventType, listener) {
        this.eventSource.addEventListener(eventType, async e => {
            try {
                await listener(e.data);
            } catch (error) {
                console.error("Failed to handle event " + eventType, error);
            }
        });
    }
}