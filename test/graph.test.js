import * as assert from 'node:assert';
import { it } from 'node:test';

import * as a from '@fixture/a';
import * as b from '@fixture/b';
import * as c from '@fixture/c';

import * as aServer from '@fixture/a?condition=react-server';
import * as bServer from '@fixture/b?condition=react-server';
import * as cServer from '@fixture/c?condition=react-server';

import * as relative from './relative-import.js';
import * as relativeServer from './relative-import.js?condition=react-server';

it('should match expected graph for no condition', () => {
  assert.notStrictEqual(a.default, aServer.default);
  assert.notStrictEqual(a.React, aServer.React);

  assert.strictEqual(a.default, 'fixture-a-client');

  // Will always be different due to the nature of `import *`
  assert.notStrictEqual(a, b.a);

  // Will match, because the actual exports are referenced objects and
  // not created during resolution of module
  assert.strictEqual(a.default, b.a.default);
  assert.strictEqual(a.React, b.a.React);

  // assert.strictEqual(a, c.a);
  // assert.strictEqual(a, relative.a);

  assert.strictEqual(b.default, 'fixture-b-client');
  // assert.strictEqual(b, c.b);
  // assert.strictEqual(b, relative.b);

  assert.strictEqual(c.default, 'fixture-c-client');
  // assert.strictEqual(c, relative.c);

  assert.notStrictEqual(
    aServer.React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED,
    a.React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED
  );
  assert.strictEqual(
    !a.React.__SECRET_SERVER_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED,
    true
  );
  assert.strictEqual(a.React, b.React);
  assert.strictEqual(a.React, c.React);
  assert.notStrictEqual(a.React, cServer.a.React);
});

it('should match expected graph for react-server condition', () => {
  assert.notStrictEqual(a.default, aServer.default);
  assert.notStrictEqual(a.React, aServer.React);

  assert.strictEqual(aServer.default, 'fixture-a-server');
  // assert.strictEqual(aServer, bServer.a);
  // assert.strictEqual(aServer, cServer.a);
  // assert.strictEqual(aServer, relativeServer.a);

  assert.strictEqual(bServer.default, 'fixture-b-server');
  // assert.strictEqual(bServer, cServer.b);
  // assert.strictEqual(bServer, relativeServer.b);

  assert.strictEqual(cServer.default, 'fixture-c-server');
  // assert.strictEqual(cServer, relativeServer.c);

  assert.notStrictEqual(
    aServer.React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED,
    a.React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED
  );
  assert.strictEqual(
    !!aServer.React.__SECRET_SERVER_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED,
    true
  );
  assert.strictEqual(aServer.React, bServer.React);
  assert.strictEqual(aServer.React, bServer.React);
  assert.strictEqual(aServer.React, cServer.React);
});
