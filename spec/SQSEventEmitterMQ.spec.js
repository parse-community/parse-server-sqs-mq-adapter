const sinon = require('sinon');
const MessageQueue = require(
  '../node_modules/parse-server/lib/ParseMessageQueue').ParseMessageQueue;
const SQSEventEmitterMQ = require('../lib/SQSEventEmitterMQ').SQSEventEmitterMQ;

let config;

describe('SMSEventEmitterMQ', () => {
  beforeEach(() => {
    const SQSEventEmitterMQOptions = {
      queueUrl: 'test-queue',
      region: 'mock',
    };

    const sqs = sinon.mock();
    sqs.sendMessageBatch = sinon.stub();
    sqs.receiveMessage = sinon.stub();
    // sqs.receiveMessage.callsArg(1);

    SQSEventEmitterMQOptions.sqs = sqs;

    config = {
      messageQueueAdapter: SQSEventEmitterMQ,
      SQSEventEmitterMQOptions,
    };
  });

  xit('happy path should work', (done) => {
    const CHANNEL = 'foo';
    const MESSAGE = 'hi';

    const subscriber = MessageQueue.createSubscriber(config);
    const publisher = MessageQueue.createPublisher(config);

    subscriber.subscribe(CHANNEL);
    subscriber.on('message', (channel, message) => {
      expect(channel).toBe(CHANNEL);
      expect(message).toBe(MESSAGE);
      // need to give the aws-sdk some time to mark the message
      setTimeout(done, 500);
    });

    publisher.publish(CHANNEL, MESSAGE);
  }).pend('this test could be used to test against an actual queue');

  describe('subscriber', () => {
    it('should only have one subscription map', () => {
      const subscriber1 = MessageQueue.createSubscriber(config);
      subscriber1.subscribe('foo');
      const subscriber2 = MessageQueue.createSubscriber(config);
      subscriber2.subscribe('bar');
      // subscribe twice for coverage sake!
      subscriber2.subscribe('bar');
      expect(subscriber2.subscriptions === subscriber1.subscriptions).toBe(true);
    });

    it('should throw if no config', () => {
      expect(() => MessageQueue.createSubscriber({ messageQueueAdapter: SQSEventEmitterMQ }))
        .toThrow(new Error('No SQSEventEmitterMQOptions found in config'));
    });

    xit('should respond to an event', () => {
      // ugh, how to do tis one....
      const subscriber = MessageQueue.createSubscriber(config);
      subscriber.subscribe('foo');
    });
  });

  describe('publisher', () => {
    it('should throw if no config', () => {
      expect(() => MessageQueue.createPublisher({ messageQueueAdapter: SQSEventEmitterMQ }))
        .toThrow(new Error('No SQSEventEmitterMQOptions found in config'));
    });

    xit('should handle happy path', () => {
      const publisher = MessageQueue.createPublisher(config);
      publisher.emit('foo', 'hi');
    });
  });
});
