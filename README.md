# Parse Server SQS Message Queue Adapter <!-- omit in toc -->

[![Build Status](https://github.com/parse-community/parse-server-sqs-mq-adapter/workflows/ci/badge.svg?branch=main)](https://github.com/parse-community/parse-server-sqs-mq-adapter/actions?query=workflow%3Aci+branch%3Amain)
[![Snyk Badge](https://snyk.io/test/github/parse-community/parse-server-sqs-mq-adapter/badge.svg)](https://snyk.io/test/github/parse-community/parse-server-sqs-mq-adapter)
[![Coverage](https://img.shields.io/codecov/c/github/parse-community/parse-server-sqs-mq-adapter/main.svg)](https://codecov.io/github/parse-community/parse-server-sqs-mq-adapter?branch=main)
[![auto-release](https://img.shields.io/badge/%F0%9F%9A%80-auto--release-9e34eb.svg)](https://github.com/parse-community/parse-server-sqs-mq-adapter/releases)

[![npm latest version](https://img.shields.io/npm/v/@parse/gcs-files-adapter.svg)](https://www.npmjs.com/package/@parse/sqs-mq-adapter)

---

The Parse Server AWS SQS Message Queue Adapter. This adapter allows a work queue to be spread across a cluster of machines.

---

- [Installation](#installation)
- [Usage](#usage)
  - [Credentials](#credentials)
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
