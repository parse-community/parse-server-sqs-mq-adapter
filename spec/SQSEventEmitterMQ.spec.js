const sinon = require('sinon');
const { ParseMessageQueue } = require('../node_modules/parse-server/lib/ParseMessageQueue');
const { SQSEventEmitterMQ } = require('../');
const { logger } = require('parse-server');

let config;

describe('SMSEventEmitterMQ', () => {
  beforeEach(() => {
    const response = {
      Messages: [{
        ReceiptHandle: 'receipt-handle',
        MessageId: '123',
        Body: 'body',
      }],
    };

    const sqs = {
      sendMessageBatch: sinon.stub(),
      send: sinon.stub()
    };
    let call = 0;
    sqs.send.callsFake(() => {
      call += 1;
      if (call === 1) {
        return Promise.resolve(response);
      }
      return Promise.resolve({});
    });

    config = {
      messageQueueAdapter: SQSEventEmitterMQ,
      queueUrl: 'test-queue',
      region: 'mock',
      sqs,
    };
  });

  xit('a test for real that can be done against a live queue', (done) => {
    const CHANNEL = 'foo';
    const MESSAGE = 'hi';

    const subscriber = ParseMessageQueue.createSubscriber(config);
    const publisher = ParseMessageQueue.createPublisher(config);

    subscriber.subscribe(CHANNEL);
    subscriber.on('message', (channel, message) => {
      expect(channel).toBe(CHANNEL);
      expect(message).toBe(MESSAGE);
      // need to give the aws-sdk some time to mark the message
      setTimeout(done, 500);
    });

    publisher.publish(CHANNEL, MESSAGE);
  }).pend('configure options for a real sqs endpoint');

  describe('subscriber', () => {
    it('should only have one subscription map', () => {
      const subscriber1 = ParseMessageQueue.createSubscriber(config);
      subscriber1.subscribe('foo');
      const subscriber2 = ParseMessageQueue.createSubscriber(config);
      subscriber2.subscribe('bar');
      // subscribe twice for coverage sake!
      subscriber2.subscribe('bar');
      expect(subscriber2.subscriptions === subscriber1.subscriptions).toBe(true);
    });

    it('should throw if no config', () => {
      expect(() => ParseMessageQueue.createSubscriber({ messageQueueAdapter: SQSEventEmitterMQ }))
        .toThrow(new Error('No queueUrl found in config'));
    });

    it('should allow unsubscribe', () => {
      const subscriber = ParseMessageQueue.createSubscriber(config);
      expect(() => subscriber.unsubscribe('foo')).not.toThrow();
    });

    it('calls the handleMessage function when a message is received', (done) => {
      const subscriber = ParseMessageQueue.createSubscriber(config);
      subscriber.subscribe('message_processed');
      subscriber.on('message', (event, message) => {
        expect(event).toBe('message_processed');
        expect(message).toBe('body');
        done();
      });
    });
  });

  describe('publisher', () => {
    it('should throw if no config', () => {
      expect(() => ParseMessageQueue.createPublisher({ messageQueueAdapter: SQSEventEmitterMQ }))
        .toThrow(new Error('Missing SQS producer option [queueUrl].'));
    });

    it('should handle happy path', () => {
      expect(() => ParseMessageQueue.createPublisher(config)).not.toThrow();
    });

    it('should publish', () => {
      const publisher = ParseMessageQueue.createPublisher(config);
      expect(() => publisher.publish('foo', 'bar')).not.toThrow();
    });

    it('should error', () => {
      const publisher = ParseMessageQueue.createPublisher(config);
      spyOn(logger, 'error');
      publisher.publish();
      const expectedError = new Error("Object messages must have 'body' prop");
      expect(logger.error).toHaveBeenCalledWith(expectedError);
    });

    it('should process a batch', () => {
      const publisher = ParseMessageQueue.createPublisher(config);
      spyOn(publisher.emitter, 'send');
      publisher.publish('channel', ['foo', 'bar']);
      const payload = [
        { id: '0', body: 'foo', groupId: 'channel' },
        { id: '1', body: 'bar', groupId: 'channel' },
      ];
      expect(publisher.emitter.send).toHaveBeenCalledWith(payload, jasmine.any(Function));
    });

    it('should process a batch with no channel', () => {
      const publisher = ParseMessageQueue.createPublisher(config);
      spyOn(publisher.emitter, 'send');
      publisher.publish(undefined, ['foo', 'bar']);
      const payload = [
        { id: '0', body: 'foo' },
        { id: '1', body: 'bar' },
      ];
      expect(publisher.emitter.send).toHaveBeenCalledWith(payload, jasmine.any(Function));
    });
  });
});
