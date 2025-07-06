const { SpecReporter } = require('jasmine-spec-reporter');

jasmine.getEnv().clearReporters();
jasmine.getEnv().addReporter(
  new SpecReporter({
    spec: {
      displayPending: true,
      displayDuration: true,
      displayStacktrace: 'pretty',
    },
  })
);
