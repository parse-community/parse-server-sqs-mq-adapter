const { ParseMessageQueue } = require('../node_modules/parse-server/lib/ParseMessageQueue');
const { getServerConfig } = require('./support/server');

describe_only_parse_server_version('>=7')('Parse Server >=7 integration test', () => {
  it('publishes a message', done => {
    const options = getServerConfig().queueOptions;
    const subscriber = ParseMessageQueue.createSubscriber(options);
    const publisher = ParseMessageQueue.createPublisher(options);
    const CHANNEL = 'foo';
    const MESSAGE = 'hi';

    subscriber.subscribe(CHANNEL);
    subscriber.on('message', (channel, message) => {
      expect(channel).toBe(CHANNEL);
      expect(message).toBe(MESSAGE);
      done();
    });

    publisher.publish(CHANNEL, MESSAGE);
  });
});
