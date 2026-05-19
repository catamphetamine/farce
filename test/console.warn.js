import { expect } from 'chai';
import sinon from 'sinon';

export function stubConsoleWarn() {
  const expected = [];
  const warned = Object.create(null); // same as `{};` but without any unintended properties pre-existing.
  const threw = false;

  /* eslint-disable no-console */
  sinon.stub(console, 'warn').callsFake((message) => {
    for (const text of expected) {
      if (message.includes(text)) {
        warned[text] = true;
        return;
      }
    }
    threw = true;
    throw new Error(message);
  });

  return {
    expect: (text) => {
      expected.push(text);
      warned[text] = false;
    },
    restoreAndCheckExpected: () => {
      console.warn.restore();
      if (!threw && expected.length > 0) {
        expect(warned).to.have.keys(expected);
      }
    }
  };
  /* eslint-enable no-console */
}
