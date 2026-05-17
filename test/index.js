import dirtyChai from 'dirty-chai';

import { stubWarn } from './shouldWarn';

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

let unstubWarn;

beforeEach(() => {
  unstubWarn = stubWarn();
});

afterEach(() => {
  unstubWarn();
  unstubWarn = undefined;
});
