const { ParseServer } = require('parse-server');
const express = require('express');
const http = require('http');
const { getMockSqsOptions } = require('../mocks/sqs');
const Config = require('../../node_modules/parse-server/lib/Config.js');

const expressApp = express();
const queueOptions = getMockSqsOptions();

let serverState = {};

const defaultConfig = {
  databaseURI: 'mongodb://127.0.0.1:27017/sqs-mq-adapter',
  appId: 'test',
  masterKey: 'test',
  serverURL: 'http://127.0.0.1:1327/api/parse',
  port: 1327,
  mountPath: '/api/parse',
  verbose: false,
  silent: true,
  queueOptions,
  verifyUserEmails: false,
};

async function startServer(config = {}) {
  if (!process.env.TESTING) {
    throw 'requires test environment to run';
  }

  const serverConfig = Object.assign({}, config, defaultConfig);
  const parseServer = ParseServer(serverConfig);
  await parseServer.start();
  expressApp.use(serverConfig.mountPath, parseServer.app);

  const httpServer = http.createServer(expressApp);
  await new Promise((resolve, reject) => {
    httpServer
      .listen(serverConfig.port)
      .once('listening', resolve)
      .once('error', (e) => reject(e));
  }).catch((e) => {
    console.log(`parse-server failed to launch with error: ${e}`);
  });

  Object.assign(serverState, {
    parseServer,
    httpServer,
    serverConfig,
  });
}

async function stopServer() {
  if (!process.env.TESTING) {
    throw 'requires test environment to run';
  }

  await Parse.User.logOut();
  const app = Config.get(defaultConfig.appId);
  await app?.database.deleteEverything(true);

  const { httpServer } = serverState;
  await new Promise((resolve) => httpServer.close(resolve));
  serverState = {};
}

async function reconfigureServer(config = {}) {
  await stopServer();
  return await startServer(config);
}

function getServerConfig() {
  return serverState.serverConfig || defaultConfig;
}

module.exports = {
  reconfigureServer,
  startServer,
  stopServer,
  getServerConfig,
};
