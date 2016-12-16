const events = require('events');
const logger = require('parse-server').logger;
const Producer = require('sqs-producer');
const SQSConsumer = require('sqs-consumer');

// const emitter = new events.EventEmitter();

// create the queue dynamically!
const producer = Producer.create({
  queueUrl: 'https://sqs.us-east-1.amazonaws.com/810605503585/Parse-Queue-Test',
  region: 'us-east-1',
});

// const emitter = new events.EventEmitter();

class Publisher {

  constructor(_emitter) {
    this.emitter = _emitter;
  }

  publish(channel, message) {
    this.emitter.send(message, (err) => {
      if (err) logger.error(err);
    });
  }
}

class Consumer extends events.EventEmitter {

  subscribe(channel) {
    this.unsubscribe(channel);

    const handler = (message, done) => {
      this.emit('message', channel, message.Body);
      const boo = done();
      // eslint-disable-next-line
      console.log('done called?', boo);
    };

    this.emitter = SQSConsumer.create({
      queueUrl: 'https://sqs.us-east-1.amazonaws.com/810605503585/Parse-Queue-Test',
      handleMessage: handler,
    });

    this.subscriptions.set(channel, handler);
    // this.emitter.on(channel, handler);
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
    Consumer.subscriptions.delete(channel);
  }
}

Consumer.prototype.subscriptions = new Map();

function createPublisher() {
  return new Publisher(producer);
}

function createSubscriber() {
  return new Consumer();
}

const SQSEventEmitterMQ = {
  createPublisher,
  createSubscriber,
};

module.exports = {
  SQSEventEmitterMQ,
};
