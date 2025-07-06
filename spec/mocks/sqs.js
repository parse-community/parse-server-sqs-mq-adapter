const { SQSEventEmitterMQ } = require('../../');

function getMockSqsOptions() {
  const response = {
    Messages: [
      {
        ReceiptHandle: 'receipt-handle',
        MessageId: '123',
        Body: 'hi',
      },
    ],
  };

  let call = 0;
  const sqs = {
    sendMessageBatch: () => Promise.resolve({}),
    send: () => {
      call += 1;
      if (call === 1) {
        return Promise.resolve(response);
      }
      return Promise.resolve({});
    },
  };

  return {
    messageQueueAdapter: SQSEventEmitterMQ,
    queueUrl: 'test-queue',
    region: 'mock',
    sqs,
  };
}

module.exports = { getMockSqsOptions };
