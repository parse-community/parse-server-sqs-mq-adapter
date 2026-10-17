const { ParseMessageQueue } = require('../node_modules/parse-server/lib/ParseMessageQueue');
const { SQSEventEmitterMQ } = require('../');
const { logger } = require('parse-server');
const { getServerConfig } = require('./support/server.js');
const { getMockSqsOptions, getSdkSqsOptions } = require('./mocks/sqs.js');

let config;

describe('SMSEventEmitterMQ', () => {
  beforeEach(() => {
    config = getMockSqsOptions();
  });

  describe('integration', () => {
    it('publishes a message', done => {
      const options = getServerConfig().queueOptions;
      const subscriber = ParseMessageQueue.createSubscriber(options);
      const publisher = ParseMessageQueue.createPublisher(options);
      const channel = 'foo';
      const message = 'hi';

      subscriber.subscribe(channel);
      subscriber.on('message', (channel, message) => {
        expect(channel).toBe(channel);
        expect(message).toBe(message);

        // Give aws-sdk some time to mark the message to avoid flaky test
        setTimeout(done, 200);
      });

      publisher.publish(channel, message);
    });
  });

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
        expect(message).toBe('hi');
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
      expect(publisher.emitter.send).toHaveBeenCalledWith(payload);
    });

    it('should process a batch with no channel', () => {
      const publisher = ParseMessageQueue.createPublisher(config);
      spyOn(publisher.emitter, 'send');
      publisher.publish(undefined, ['foo', 'bar']);
      const payload = [
        { id: '0', body: 'foo' },
        { id: '1', body: 'bar' },
      ];
      expect(publisher.emitter.send).toHaveBeenCalledWith(payload);
    });
  });

  describe('with AWS SDK client', () => {
    it('publishes messages', async () => {
      const { options, requests } = getSdkSqsOptions();
      const publisher = ParseMessageQueue.createPublisher(options);
      const send = spyOn(publisher.emitter, 'send').and.callThrough();
      publisher.publish('channel', ['foo', 'bar']);
      const sent = await send.calls.mostRecent().returnValue;
      expect(requests).toEqual([
        {
          operation: 'SendMessageBatch',
          input: {
            QueueUrl: options.queueUrl,
            Entries: [
              { Id: '0', MessageBody: 'foo', MessageGroupId: 'channel' },
              { Id: '1', MessageBody: 'bar', MessageGroupId: 'channel' },
            ],
          },
        },
      ]);
      expect(sent).toEqual([
        jasmine.objectContaining({ Id: '0', MessageId: 'message-0' }),
        jasmine.objectContaining({ Id: '1', MessageId: 'message-1' }),
      ]);
    });

    it('receives and deletes a message', async () => {
      const { options, requests } = getSdkSqsOptions({
        messages: [{ MessageId: '123', ReceiptHandle: 'receipt-handle', Body: 'hi' }],
      });
      const subscriber = ParseMessageQueue.createSubscriber(options);
      const received = [];
      subscriber.on('message', (channel, message) => received.push([channel, message]));
      subscriber.subscribe('sdk-channel');
      try {
        await new Promise((resolve, reject) => {
          subscriber.emitter.once('message_processed', resolve);
          subscriber.emitter.once('error', reject);
        });
      } finally {
        subscriber.unsubscribe('sdk-channel');
      }
      expect(received).toEqual([['sdk-channel', 'hi']]);
      expect(requests.map(({ operation }) => operation)).toEqual(['ReceiveMessage', 'DeleteMessage']);
      expect(requests[0].input).toEqual(jasmine.objectContaining({
        QueueUrl: options.queueUrl,
        MaxNumberOfMessages: 1,
        WaitTimeSeconds: 20,
      }));
      expect(requests[1].input).toEqual({ QueueUrl: options.queueUrl, ReceiptHandle: 'receipt-handle' });
    });
  });
});
