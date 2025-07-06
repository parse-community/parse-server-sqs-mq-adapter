const { ParseMessageQueue } = require('../node_modules/parse-server/lib/ParseMessageQueue');
const { getServerConfig } = require('./support/server');

describe('Parse Server integration', () => {
  it('publishes a message', async done => {
    const options = getServerConfig().queueOptions;
    const subscriber = ParseMessageQueue.createSubscriber(options);
    const publisher = ParseMessageQueue.createPublisher(options);
    const channel = 'foo';
    const message = 'hi';

    subscriber.subscribe(channel);
    subscriber.on('message', (channel, message) => {
      expect(channel).toBe(channel);
      expect(message).toBe(message);
      done();
    });

    publisher.publish(channel, message);
  });
});
