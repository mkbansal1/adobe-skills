# Testing Patterns for App Builder Actions

## Unit Test Pattern

Mock all SDK dependencies, test the `main()` export with various parameter combinations, and assert the response shape `{ statusCode, body }`.

### Structure

```javascript
const action = require('<path-to-action>/index.js');

// Mock all SDK dependencies BEFORE requiring the action
jest.mock('@adobe/aio-sdk', () => ({ /* see mock-catalog.md */ }));

describe('<action-name>', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns 200 with valid params', async () => {
    const params = {
      __ow_headers: { authorization: 'Bearer test-token' },
      LOG_LEVEL: 'info',
      // action-specific params
    };
    const result = await action.main(params);
    expect(result.statusCode).toBe(200);
    expect(result.body).toBeDefined();
  });

  test('returns 400 when required param missing', async () => {
    const result = await action.main({ __ow_headers: {} });
    expect(result.statusCode).toBe(400);
    expect(result.body.error).toBeDefined();
  });

  test('returns 500 on SDK failure', async () => {
    // Configure mock to throw
    const result = await action.main({ __ow_headers: {}, LOG_LEVEL: 'info' });
    expect(result.statusCode).toBe(500);
  });
});
```

### Key Rules

1. **Always mock before require** — `jest.mock()` is hoisted but mock factories run before module load.
2. **Clear mocks in beforeEach** — Prevents state leaking between tests.
3. **Test the three paths** — Success (200), bad input (400), internal error (500).
4. **Assert response shape** — Every action returns `{ statusCode, body }`. Optionally `headers`.
5. **Use CommonJS** — App Builder actions use `require()` / `module.exports`.

## Integration Test Pattern

Deploy the action to a Stage workspace, invoke it via CLI or HTTP, and assert the response matches the expected schema.

### Structure

```javascript
const { execSync } = require('child_process');

describe('<action-name> integration', () => {
  const ACTION_NAME = '<action-name>';

  test('responds with expected schema when invoked', () => {
    const result = JSON.parse(
      execSync(`aio rt action invoke ${ACTION_NAME} --result -p key value`, {
        encoding: 'utf-8',
      })
    );
    expect(result.statusCode).toBe(200);
    expect(result.body).toHaveProperty('expectedField');
  });

  test('returns error for invalid input', () => {
    const result = JSON.parse(
      execSync(`aio rt action invoke ${ACTION_NAME} --result`, {
        encoding: 'utf-8',
      })
    );
    expect(result.statusCode).toBe(400);
  });
});
```

### Key Rules

1. **Requires deployed action** — Run `aio app deploy` to Stage before integration tests.
2. **Use `--result` flag** — Returns only the action result, not activation metadata.
3. **Test real SDK interactions** — State, Files, Events SDKs work against real services.
4. **Separate from unit tests** — Place in `test/integration/` or use Jest `--testPathPattern`.
5. **CI consideration** — Integration tests need workspace credentials; run in CI with secrets configured.

## Contract Test Pattern

Record real Adobe API responses, replay them in tests to verify the action handles actual response shapes correctly.

### Structure

```javascript
const nock = require('nock');
const action = require('<path-to-action>/index.js');

// Recorded response from real Adobe API
const RECORDED_RESPONSE = require('./fixtures/adobe-api-response.json');

describe('<action-name> contract', () => {
  beforeEach(() => jest.clearAllMocks());
  afterEach(() => nock.cleanAll());

  test('handles real API response shape', async () => {
    nock('https://platform.adobe.io')
      .get('/path/to/api')
      .reply(200, RECORDED_RESPONSE);

    const result = await action.main({ __ow_headers: {}, /* params */ });
    expect(result.statusCode).toBe(200);
  });
});
```

### Key Rules

1. **Record real responses** — Capture actual API responses as JSON fixtures.
2. **Use nock or similar** — Intercept HTTP at the network level, not SDK level.
3. **Update fixtures periodically** — API response shapes can change; re-record quarterly.
4. **Test edge cases from real data** — Empty arrays, pagination tokens, error responses.

## Error Scenario Testing

Always test these error conditions for every action:

| Scenario | Setup | Expected |
| --- | --- | --- |
| Missing required params | Omit required fields from `params` | `{ statusCode: 400 }` |
| Invalid auth | Empty or bad `__ow_headers.authorization` | `{ statusCode: 401 }` or `{ statusCode: 403 }` |
| SDK init failure | Mock SDK `init()` to reject | `{ statusCode: 500 }` |
| SDK operation failure | Mock SDK method (get/put/etc.) to reject | `{ statusCode: 500 }` |
| Timeout simulation | Mock with `setTimeout` + jest.useFakeTimers | Action handles gracefully |
| Malformed input | Send wrong types, empty strings, huge payloads | `{ statusCode: 400 }` |

## Database Action Testing

For actions using `@adobe/aio-lib-core-database`:

```javascript
jest.mock('@adobe/aio-lib-core-database', () => ({
  init: jest.fn().mockResolvedValue({
    createCollection: jest.fn().mockResolvedValue(true),
    getCollection: jest.fn().mockResolvedValue({
      insertOne: jest.fn().mockResolvedValue({ id: 'doc-1' }),
      findOne: jest.fn().mockResolvedValue({ id: 'doc-1', data: {} }),
      find: jest.fn().mockResolvedValue({ items: [], hasMore: false }),
      replaceOne: jest.fn().mockResolvedValue({ id: 'doc-1' }),
      deleteOne: jest.fn().mockResolvedValue(true),
    }),
  }),
}));
```

Test pagination by varying the `find()` mock return to include `hasMore: true` and cursor values.
