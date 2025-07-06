# Parse Server SQS Message Queue Adapter <!-- omit in toc -->

[![Build Status](https://github.com/parse-community/parse-server-sqs-mq-adapter/workflows/ci/badge.svg?branch=main)](https://github.com/parse-community/parse-server-sqs-mq-adapter/actions?query=workflow%3Aci+branch%3Amain)
[![Snyk Badge](https://snyk.io/test/github/parse-community/parse-server-sqs-mq-adapter/badge.svg)](https://snyk.io/test/github/parse-community/parse-server-sqs-mq-adapter)
[![Coverage](https://img.shields.io/codecov/c/github/parse-community/parse-server-sqs-mq-adapter/main.svg)](https://codecov.io/github/parse-community/parse-server-sqs-mq-adapter?branch=main)
[![auto-release](https://img.shields.io/badge/%F0%9F%9A%80-auto--release-9e34eb.svg)](https://github.com/parse-community/parse-server-sqs-mq-adapter/releases)

[![npm latest version](https://img.shields.io/npm/v/@parse/gcs-files-adapter.svg)](https://www.npmjs.com/package/@parse/sqs-mq-adapter)

---

The Parse Server AWS SQS Message Queue Adapter integrates Amazon SQS as the underlying message queue for Parse Server. It allows jobs and live query events to be distributed across multiple Parse Server instances.

---

- [Installation](#installation)
- [Usage](#usage)
  - [Integrate with Parse Server](#integrate-with-parse-server)
  - [Credentials](#credentials)
  - [Push Notifications](#push-notifications)
## Installation

`npm install --save @parse/sqs-mq-adapter`

## Usage

```js
const ParseServer = require('parse-server').ParseServer;
const SQSEventEmitterMQ = require('@parse/sqs-mq-adapter').SQSEventEmitterMQ;

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


### Integrate with Parse Server

1. **Install dependencies**

   ```bash
   npm install parse-server @parse/sqs-mq-adapter
   ```

2. **Configure the adapter** in your Parse Server configuration:

   ```js
   const { ParseServer } = require('parse-server');
   const { SQSEventEmitterMQ } = require('@parse/sqs-mq-adapter');

   const config = {
     databaseURI: 'mongodb://localhost:27017/app',
     appId: 'myAppId',
     masterKey: 'myMasterKey',
     serverURL: 'https://example.com/parse',
     queueOptions: {
       messageQueueAdapter: SQSEventEmitterMQ,
       queueUrl: 'https://sqs.us-east-1.amazonaws.com/XXX/Parse-Queue',
       region: 'us-east-1',
     },
   };

   const server = new ParseServer(config);
   ```

3. **Start Parse Server** and the adapter will listen to the configured SQS queue.

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
const SQSEventEmitterMQ = require('@parse/sqs-mq-adapter').SQSEventEmitterMQ;
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

### Push Notifications

When using SQS to share the push queue across instances, disable the built-in push worker so only the adapter processes pushes from the queue.

```js
const { ParseServer } = require('parse-server');
const { SQSEventEmitterMQ } = require('@parse/sqs-mq-adapter');

const config = {
  push: {
    adapter: new MyPushAdapter(),
    queueOptions: {
      messageQueueAdapter: SQSEventEmitterMQ,
      queueUrl: 'https://sqs.us-east-1.amazonaws.com/XXX/Push-Queue',
      region: 'us-east-1',
      disablePushWorker: true,
    },
  },
};

const server = new ParseServer(config);
```

Setting \`disablePushWorker: true\` ensures Parse Server enqueues push notifications while a single worker reads them from the queue via this adapter.
