# Testing Standards

## Overview
These testing standards apply across all Agent-OS 2.0 projects. Check your stack skill for framework-specific testing tools and conventions (Jest, Vitest, Pytest, etc.).

## Testing Philosophy

### Why We Test
- Catch bugs early
- Document behavior
- Enable confident refactoring
- Prevent regressions
- Improve code design

### Test Pyramid
```
       /\
      /E2E\      <- Few: Critical user flows
     /------\
    /  API  \    <- Some: Integration tests
   /--------\
  /   Unit   \   <- Many: Fast, focused tests
 /------------\
```

## Test Types

### Unit Tests
**What**: Test individual functions, methods, or components in isolation

**When**: For all business logic, utilities, pure functions

**Example:**
```javascript
// Function
function calculateDiscount(price, discountPercent) {
  return price * (1 - discountPercent / 100);
}

// Test
describe('calculateDiscount', () => {
  it('applies discount correctly', () => {
    expect(calculateDiscount(100, 10)).toBe(90);
  });

  it('handles zero discount', () => {
    expect(calculateDiscount(100, 0)).toBe(100);
  });

  it('handles 100% discount', () => {
    expect(calculateDiscount(100, 100)).toBe(0);
  });
});
```

### Integration Tests
**What**: Test how multiple units work together

**When**: For API endpoints, database operations, external service calls

**Example:**
```javascript
describe('POST /api/users', () => {
  it('creates user and returns 201', async () => {
    const response = await request(app)
      .post('/api/users')
      .send({ email: 'test@example.com', name: 'Test User' });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');

    // Verify in database
    const user = await db.users.findById(response.body.id);
    expect(user.email).toBe('test@example.com');
  });
});
```

### End-to-End Tests
**What**: Test complete user flows through the application

**When**: For critical paths (signup, checkout, core features)

**Example:**
```javascript
describe('User signup flow', () => {
  it('completes signup and redirects to dashboard', async () => {
    await page.goto('/signup');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'SecurePass123');
    await page.click('button[type="submit"]');

    await page.waitForURL('/dashboard');
    expect(page.url()).toContain('/dashboard');
  });
});
```

## Test Structure: AAA Pattern

### Arrange, Act, Assert
```javascript
test('user can add item to cart', () => {
  // Arrange: Set up test data and state
  const cart = new ShoppingCart();
  const item = { id: 1, name: 'Widget', price: 10 };

  // Act: Perform the action being tested
  cart.addItem(item);

  // Assert: Verify the outcome
  expect(cart.items).toHaveLength(1);
  expect(cart.total).toBe(10);
});
```

## Naming Conventions

### Test Files
Follow your stack's convention:
- `*.test.js` / `*.test.ts` (JavaScript/TypeScript)
- `*_test.py` (Python)
- `*.spec.js` (Alternative JavaScript convention)

### Test Descriptions
```javascript
// Good: Descriptive, reads like a sentence
describe('User authentication', () => {
  it('returns 401 when credentials are invalid', () => { });
  it('returns JWT token when credentials are valid', () => { });
  it('returns 400 when email is missing', () => { });
});

// Bad: Vague or technical jargon
describe('auth', () => {
  it('test 1', () => { });
  it('handles edge case', () => { });
});
```

### Use "should" or "it"
```javascript
// Both are acceptable, be consistent
it('should return 404 when user not found', () => { });
it('returns 404 when user not found', () => { });
```

## What to Test

### ✅ DO Test
- Business logic
- Edge cases and error conditions
- Validation logic
- API endpoints (input/output)
- User interactions (clicks, form submissions)
- Data transformations
- Authentication and authorization

### ❌ DON'T Test
- External libraries (trust they're tested)
- Simple getters/setters with no logic
- Framework internals
- Generated code
- Database vendor features

## Test Coverage

### Target Coverage
- **Aim for 80%+ code coverage**
- Focus on critical paths (may be 100%)
- Don't chase 100% coverage everywhere
- Coverage is a metric, not a goal

### What Matters More Than Coverage
- Testing the right things
- Testing edge cases
- Testing user flows
- Having maintainable tests

## Writing Good Tests

### 1. Tests Should Be Independent
```javascript
// Bad: Tests depend on each other
let user;
test('creates user', () => {
  user = createUser({ name: 'Test' });
});
test('updates user', () => {
  updateUser(user.id, { name: 'Updated' });
});

// Good: Each test is self-contained
test('creates user', () => {
  const user = createUser({ name: 'Test' });
  expect(user.name).toBe('Test');
});

test('updates user', () => {
  const user = createUser({ name: 'Test' });
  updateUser(user.id, { name: 'Updated' });
  const updated = getUser(user.id);
  expect(updated.name).toBe('Updated');
});
```

### 2. Tests Should Be Fast
- Mock external services
- Use in-memory databases for tests
- Don't add unnecessary delays
- Run unit tests frequently during development

### 3. Tests Should Be Deterministic
```javascript
// Bad: Flaky test (depends on timing)
test('data loads within 1 second', async () => {
  const start = Date.now();
  await loadData();
  expect(Date.now() - start).toBeLessThan(1000);
});

// Good: Tests behavior, not timing
test('data loads successfully', async () => {
  const data = await loadData();
  expect(data).toBeDefined();
  expect(data.items).toHaveLength(5);
});
```

### 4. One Assertion Concept Per Test
```javascript
// OK: Multiple assertions testing one concept
test('creates user with correct properties', () => {
  const user = createUser({ name: 'Test', email: 'test@example.com' });
  expect(user.name).toBe('Test');
  expect(user.email).toBe('test@example.com');
  expect(user.id).toBeDefined();
});

// Bad: Testing multiple unrelated things
test('user system works', () => {
  const user = createUser({ name: 'Test' });
  expect(user.name).toBe('Test');

  updateUser(user.id, { name: 'Updated' });
  expect(getUser(user.id).name).toBe('Updated');

  deleteUser(user.id);
  expect(getUser(user.id)).toBeNull();
});
// Split into 3 tests!
```

## Mocking and Stubbing

### When to Mock
- External API calls
- Database calls (in unit tests)
- Time-dependent functions (Date.now())
- Random functions (Math.random())
- File system operations

### Mock External Services
```javascript
// Mock API calls
jest.mock('./api', () => ({
  fetchUser: jest.fn(() => Promise.resolve({ id: 1, name: 'Test' }))
}));

test('displays user data', async () => {
  const user = await fetchUser(1);
  expect(user.name).toBe('Test');
});
```

### Don't Over-Mock
```javascript
// Bad: Mocking everything, testing nothing
const mockAdd = jest.fn(() => 3);
expect(mockAdd(1, 2)).toBe(3);

// Good: Test real implementation
function add(a, b) { return a + b; }
expect(add(1, 2)).toBe(3);
```

## Test Data

### Use Factories or Fixtures
```javascript
// Factory pattern
function createTestUser(overrides = {}) {
  return {
    id: 1,
    name: 'Test User',
    email: 'test@example.com',
    isActive: true,
    ...overrides
  };
}

// Usage
test('inactive users cannot login', () => {
  const user = createTestUser({ isActive: false });
  expect(canLogin(user)).toBe(false);
});
```

### Avoid Magic Values
```javascript
// Bad: What's special about these values?
expect(calculateTotal([10, 20, 30])).toBe(60);

// Good: Clear intent
const items = [
  { price: 10 },
  { price: 20 },
  { price: 30 }
];
const expectedTotal = 60;
expect(calculateTotal(items)).toBe(expectedTotal);
```

## Testing Async Code

### Async/Await (Preferred)
```javascript
test('fetches user data', async () => {
  const user = await fetchUser(1);
  expect(user.name).toBe('Test User');
});
```

### Promises
```javascript
test('fetches user data', () => {
  return fetchUser(1).then(user => {
    expect(user.name).toBe('Test User');
  });
});
```

### Callbacks (Legacy)
```javascript
test('fetches user data', (done) => {
  fetchUser(1, (user) => {
    expect(user.name).toBe('Test User');
    done();
  });
});
```

## Testing Errors

### Test Error Conditions
```javascript
test('throws error when email is invalid', () => {
  expect(() => {
    createUser({ email: 'invalid' });
  }).toThrow('Invalid email');
});

// Async errors
test('rejects when user not found', async () => {
  await expect(fetchUser(9999)).rejects.toThrow('User not found');
});
```

## Component Testing (Frontend)

### Test User Interactions
```javascript
test('form submits with valid data', async () => {
  render(<SignupForm />);

  await userEvent.type(screen.getByLabelText('Email'), 'test@example.com');
  await userEvent.type(screen.getByLabelText('Password'), 'SecurePass123');
  await userEvent.click(screen.getByRole('button', { name: 'Sign Up' }));

  expect(await screen.findByText('Account created!')).toBeInTheDocument();
});
```

### Test Component Output
```javascript
test('displays user information', () => {
  const user = { name: 'Test User', email: 'test@example.com' };
  render(<UserProfile user={user} />);

  expect(screen.getByText('Test User')).toBeInTheDocument();
  expect(screen.getByText('test@example.com')).toBeInTheDocument();
});
```

### Test Conditional Rendering
```javascript
test('shows loading state', () => {
  render(<UserProfile isLoading={true} />);
  expect(screen.getByText('Loading...')).toBeInTheDocument();
});

test('shows error state', () => {
  render(<UserProfile error="Failed to load" />);
  expect(screen.getByText('Failed to load')).toBeInTheDocument();
});
```

## Database Testing

### Use Test Database
- Separate database for tests
- Reset between tests
- Use transactions that rollback

### Seed Test Data
```javascript
beforeEach(async () => {
  await db.users.create({ email: 'test@example.com', name: 'Test' });
  await db.posts.create({ title: 'Test Post', userId: 1 });
});

afterEach(async () => {
  await db.posts.destroy({ where: {} });
  await db.users.destroy({ where: {} });
});
```

## Test Organization

### Group Related Tests
```javascript
describe('ShoppingCart', () => {
  describe('addItem', () => {
    it('adds item to empty cart', () => { });
    it('increments quantity for duplicate item', () => { });
    it('throws error when item is invalid', () => { });
  });

  describe('removeItem', () => {
    it('removes item from cart', () => { });
    it('throws error when item not in cart', () => { });
  });
});
```

### Use Setup and Teardown
```javascript
describe('User authentication', () => {
  let user;

  beforeEach(() => {
    user = createTestUser();
  });

  afterEach(() => {
    cleanupTestUser(user);
  });

  it('authenticates valid user', () => {
    // user is available here
  });
});
```

## Test-Driven Development (TDD)

### Red-Green-Refactor
1. **Red**: Write failing test
2. **Green**: Write minimal code to pass
3. **Refactor**: Improve code while keeping tests green

### When to Use TDD
- When requirements are clear
- When building new features
- When fixing bugs (write test first to reproduce)

### When to Skip TDD
- When exploring or prototyping
- When requirements are unclear
- When writing tests is significantly more complex than implementation

## Running Tests

### Run Tests Frequently
```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run specific test file
npm test -- user.test.js

# Run tests with coverage
npm test -- --coverage
```

### Continuous Integration
- Run tests on every commit
- Block merges if tests fail
- Run tests in CI environment matching production

## Quick Reference

✅ **DO:**
- Write tests for business logic
- Test edge cases and errors
- Make tests independent
- Use descriptive test names
- Keep tests simple and readable
- Mock external dependencies
- Aim for 80%+ coverage

❌ **DON'T:**
- Test external libraries
- Write dependent tests
- Make slow tests
- Write flaky tests
- Skip error case testing
- Chase 100% coverage blindly

---

**Remember**: Tests are documentation. They should clearly show how your code is supposed to work.
