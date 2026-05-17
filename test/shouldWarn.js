// With such `import`, tests wouldn't work and would throw an error:
// "console.warn.restore is not a function".
// It could or could not be related to using `karma` test runner.
//
// import sinon from 'sinon';

export default function shouldWarn(about) {
  console.warn.expected.push(about); // eslint-disable-line no-console
}

export function stubWarn() {
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

  return () => {
    const { expected, warned, threw } = console.warn;
    console.warn.restore();

    if (!threw && expected.length) {
      expect(warned).to.have.keys(expected);
    }
  };
  /* eslint-enable no-console */
}
