import { stubConsoleWarn } from './console.warn.js';

let unstubConsoleWarn;

beforeEach(() => {
  unstubConsoleWarn = stubConsoleWarn();
});

afterEach(() => {
  unstubConsoleWarn();
  unstubConsoleWarn = undefined;
});
