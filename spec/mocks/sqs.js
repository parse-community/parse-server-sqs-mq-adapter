const { createHash } = require('crypto');
const { SQSClient } = require('@aws-sdk/client-sqs');
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

const md5 = value => createHash('md5').update(value).digest('hex');

// Returns adapter options with a real AWS SDK SQS client. Only the HTTP request handler is
// stubbed, so every command still goes through the SDK's request serialization, signing,
// response deserialization and message MD5 checksum validation, without network access.
// The stub records each request and answers like SQS: sent messages are accepted and the
// given messages are delivered once by the first `ReceiveMessage` request.
function getSdkSqsOptions({ messages = [] } = {}) {
  const requests = [];
  const outputs = {
    SendMessageBatch: ({ Entries }) => ({
      Successful: Entries.map(({ Id, MessageBody }) => ({
        Id,
        MessageId: `message-${Id}`,
        MD5OfMessageBody: md5(MessageBody),
      })),
      Failed: [],
    }),
    ReceiveMessage: () => ({
      Messages: messages.splice(0).map(message => ({ ...message, MD5OfBody: md5(message.Body) })),
    }),
  };

  const requestHandler = {
    handle: async request => {
      const operation = request.headers['x-amz-target'].replace('AmazonSQS.', '');
      const body = typeof request.body === 'string' ? request.body : new TextDecoder().decode(request.body);
      const input = JSON.parse(body);
      requests.push({ operation, input });
      const output = outputs[operation] ? outputs[operation](input) : {};
      return {
        response: {
          statusCode: 200,
          headers: { 'content-type': 'application/x-amz-json-1.0' },
          body: Buffer.from(JSON.stringify(output)),
        },
      };
    },
  };

  const sqs = new SQSClient({
    region: 'us-east-1',
    credentials: { accessKeyId: 'test', secretAccessKey: 'test' },
    requestHandler,
  });

  return {
    options: {
      messageQueueAdapter: SQSEventEmitterMQ,
      queueUrl: 'https://sqs.us-east-1.amazonaws.com/123456789012/test-queue',
      sqs,
    },
    requests,
  };
}

module.exports = { getMockSqsOptions, getSdkSqsOptions };
