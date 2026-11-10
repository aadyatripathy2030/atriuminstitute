// Local answer checker (grade-lib.js), used when the AI grader is unreachable.
const test = require('node:test');
const assert = require('node:assert');
const { localCheck } = require('../grade-lib');

test('rejects wrong answers that merely overlap the right one', () => {
  const wrong = [
    ['12', '123'], ['10', '100'], ['25', '2.5'], ['1234567890', '12'],
    ['x>3', 'x<3'], ['-3', '3'], ['3', '-3'], ['y=2x-1', 'y = 2x + 1'],
    ['x=5', 'x = 5 or x = -3'], ['(3,2)', '(2,3)'], ['2', '1/2'], ['5', '5x'],
    ['', '5'], ['   ', '5'],
  ];
  for (const [user, key] of wrong) assert.strictEqual(localCheck(user, key), false, `${user} vs ${key}`);
});

test('accepts the same answer written differently', () => {
  const right = [
    ['5', 'x = 5'], ['x = 5', '5'], ['1/2', '0.5'], ['0.5', '\\frac{1}{2}'],
    ['-3, 5', 'x = 5 or x = -3'], ['5 and -3', 'x=5, x=-3'], ['12 ft', '12'],
    ['x ≥ 3', 'x \\geq 3'], ['x>=3', 'x \\ge 3'], ['\\left(2,3\\right)', '(2,3)'],
    ['Slope', 'slope'], ['y=2x+1', 'y = 2x + 1'], ['−4', '-4'], ['72°', '72'],
    ['3990', '3,990'], ['399', '399 apples'], ['6', '6 m'], ['12', '12 sq units'],
    ['sin theta', '\\(\\sin\\theta\\)'], ['32', '32 pieces'],
  ];
  for (const [user, key] of right) assert.strictEqual(localCheck(user, key), true, `${user} vs ${key}`);
});
