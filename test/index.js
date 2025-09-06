import dirtyChai from 'dirty-chai';

// `dirty-chai` package is used to create functions like `.to.be.true()`
// from `chai` `expect` properties like `.to.be.true`.
//
// The rationale is that the latter form — i.e. when not using `dirty-chai` —
// is prone to typos like `.to.be.ture` which wouldn't throw any error and the test would still pass.
// Contrary to that, `.to.be.ture()` notation would catch the typo and would throw an error.
//
// https://stackoverflow.com/questions/54332284/what-exactly-does-dirty-chai-js-do
global.chai.use(dirtyChai);

// Ensure all files in src folder are loaded for proper code coverage analysis.
const srcContext = require.context('../src', true, /.*\.js$/);
srcContext.keys().forEach(srcContext);

// const testsContext = import.meta.webpackContext('.', true, /\.test\.js$/);
const testsContext = require.context('.', true, /\.test\.js$/);
testsContext.keys().forEach(testsContext);

beforeEach(() => {
  /* eslint-disable no-console */
  sinon.stub(console, 'warn').callsFake((message) => {
    let expected = false;

    console.warn.expected.forEach((about) => {
      if (message.includes(about)) {
        console.warn.warned[about] = true;
        expected = true;
      }
    });

    if (expected) {
      return;
    }

    console.warn.threw = true;
    throw new Error(message);
  });

  console.warn.expected = [];
  console.warn.warned = Object.create(null);
  console.warn.threw = false;
  /* eslint-enable no-console */
});

afterEach(() => {
  /* eslint-disable no-console */
  const { expected, warned, threw } = console.warn;
  console.warn.restore();

  if (!threw && expected.length) {
    expect(warned).to.have.keys(expected);
  }
  /* eslint-enable no-console */
});
