[![Build Status](https://travis-ci.org/parse-server-modules/parse-server-sqs-mq-adapter.svg?branch=master)](https://travis-ci.org/parse-server-modules/parse-server-sqs-mq-adapter)
[![codecov](https://codecov.io/gh/parse-server-modules/parse-server-sqs-mq-adapter/branch/master/graph/badge.svg)](https://codecov.io/gh/parse-server-modules/parse-server-sqs-mq-adapter)

# parse-server-sqs-mq-adapter
AWS SQS backed message queue.  This adapter allows a work queue to be spread across a cluster of machines.

## Installation

`npm install --save parse-server-sqs-mq-adapter`

## Usage

```js
const ParseServer = require('parse-server').ParseServer;
const SQSEventEmitterMQ = require('parse-server-sqs-mq-adapter').SQSEventEmitterMQ;

config = {
  ....
  queueOptions: {
    messageQueueAdapter: SQSEventEmitterMQ,
    queueUrl: 'https://sqs.us-east-1.amazonaws.com/XXX/Parse-Queue', // required
    region: 'us-east-1',
  },
};

const parseServer = new ParseServer(config);
```

See: [sqs-consumer](https://www.npmjs.com/package/sqs-consumer#options) for complete list of configuration options.
### Credentials

By default the consumer will look for AWS credentials in the places [specified by the AWS SDK](http://docs.aws.amazon.com/AWSJavaScriptSDK/guide/node-configuring.html#Setting_AWS_Credentials). The simplest option is to export your credentials as environment variables:

```bash
export AWS_SECRET_ACCESS_KEY=...
export AWS_ACCESS_KEY_ID=...
```

If you need to specify your credentials manually, you can use a pre-configured instance of the [AWS SQS](http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/SQS.html) client:


```js
const ParseServer = require('parse-server').ParseServer;
const SQSEventEmitterMQ = require('SQSEventEmitterMQ');
const AWS = require('aws-sdk');

AWS.config.update({
  region: 'eu-west-1',
  accessKeyId: '...',
  secretAccessKey: '...'
});

config = {
  ....
  messageQueueAdapter: SQSEventEmitterMQ,
  SQSEventEmitterMQOptions: {
    queueUrl: 'https://sqs.us-east-1.amazonaws.com/XXX/Parse-Queue',
    sqs: new AWS.SQS(),
  },
};

const parseServer = new ParseServer(config);

```
