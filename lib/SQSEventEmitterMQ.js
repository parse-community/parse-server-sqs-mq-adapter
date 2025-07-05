const events = require('events');
const { logger } = require('parse-server');
const SQSProducer = require('sqs-producer');
const { Consumer: SQSConsumer } = require('sqs-consumer');

class Publisher {
  constructor(config) {
    const producer = SQSProducer.create(config);
    this.emitter = producer;
  }

  publish(channel, message) {
    let payload;
    if (Array.isArray(message)) {
      payload = message.map((body, index) => Object.assign({ id: index.toString(), body }, channel
        ? { groupId: channel } : {}));
    } else {
      payload = Object.assign({ id: '0', body: message }, channel ? { groupId: channel } : {});
    }

    this.emitter.send(payload, (err) => {
      if (err) logger.error(err);
    });
  }
}

class Consumer extends events.EventEmitter {
  constructor(config) {
    super();
    if (!config.queueUrl) {
      throw new Error('No queueUrl found in config');
    }
    this.config = config;
  }

  subscribe(channel) {
    this.unsubscribe(channel);

    const handleMessage = async (message) => {
      this.emit('message', channel, message.Body);
    };

    const createOptions = Object.assign(this.config, { handleMessage });
    this.emitter = SQSConsumer.create(createOptions);

    this.subscriptions.set(channel, handleMessage);
    this.emitter.start();
  }

  unsubscribe(channel) {
    if (this.emitter) {
      this.emitter.stop();
    }

    if (!this.subscriptions.has(channel)) {
      logger.debug('No channel to unsub from');
      return;
    }
    logger.debug('unsub ', channel);
    if (this.emitter) {
      this.emitter.removeListener(channel, this.subscriptions.get(channel));
    }
    this.subscriptions.delete(channel);
  }
}

Consumer.prototype.subscriptions = new Map();

function createPublisher(config) {
  return new Publisher(config);
}

function createSubscriber(config) {
  return new Consumer(config);
}

const SQSEventEmitterMQ = {
  createPublisher,
  createSubscriber,
};

module.exports = {
  SQSEventEmitterMQ,
};
