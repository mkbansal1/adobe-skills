/**
 * Mock for @adobe/aio-lib-core-database — App Builder Database SDK
 *
 * Usage: Copy the jest.mock() block below into your test file BEFORE requiring
 * the action under test.
 *
 * The mock provides a full in-memory mock of the Database SDK with common defaults.
 * Customize return values per test using mockResolvedValueOnce().
 */

// --- In-memory store for stateful testing (optional) ---
const memoryStore = new Map();

// --- Mock instance (exported for assertion access) ---
const mockDatabaseInstance = {
  get: jest.fn().mockImplementation(async (key) => {
    const value = memoryStore.get(key);
    return value !== undefined ? { value, key } : undefined;
  }),
  put: jest.fn().mockImplementation(async (key, value, options) => {
    memoryStore.set(key, value);
    return key;
  }),
  query: jest.fn().mockResolvedValue({
    documents: [],
    bookmark: null,
  }),
  delete: jest.fn().mockImplementation(async (key) => {
    memoryStore.delete(key);
    return key;
  }),
  deleteAll: jest.fn().mockImplementation(async () => {
    memoryStore.clear();
    return true;
  }),
};

// --- Jest mock setup ---
jest.mock('@adobe/aio-lib-core-database', () => ({
  init: jest.fn().mockResolvedValue(mockDatabaseInstance),
}));

// --- Helper to reset store between tests ---
function resetMocks() {
  memoryStore.clear();
  jest.clearAllMocks();
}

module.exports = { mockDatabaseInstance, resetMocks, memoryStore };
