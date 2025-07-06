'use strict';
const { startServer, stopServer, reconfigureServer } = require('./server');

jasmine.DEFAULT_TIMEOUT_INTERVAL = process.env.TESTING_TIMEOUT || '360000';

beforeAll(async () => {
  await startServer();
});

afterAll(async () => {
  await stopServer();
});

beforeEach(async () => {
  await reconfigureServer();
});
