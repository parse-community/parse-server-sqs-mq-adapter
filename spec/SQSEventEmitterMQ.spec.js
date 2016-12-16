const MessageQueue = require('../node_modules/parse-server/lib/ParseMessageQueue').ParseMessageQueue;
const SQSEventEmitterMQ = require('../lib/SQSEventEmitterMQ').SQSEventEmitterMQ;

const config = {
  messageQueueAdapter: SQSEventEmitterMQ,
};

describe('SMSEventEmitterMQ', () => {
  fit('should do something', (done) => {
    const subscriber = MessageQueue.createSubscriber(config);
    const publisher = MessageQueue.createPublisher(config);

    subscriber.subscribe('foo');
    subscriber.on('message', (channel, message) => {
      console.log('message', channel, message);
      done();
    });
    publisher.publish('foo', 'hi');
  });

  it('should only have one subscription map', () => {
    const subscriber1 = MessageQueue.createSubscriber(config);
    subscriber1.subscribe('foo');
    const subscriber2 = MessageQueue.createSubscriber(config);
    subscriber2.subscribe('bar');
    expect(subscriber2.subscriptions === subscriber1.subscriptions).toBe(true);
  });
});
