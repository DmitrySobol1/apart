# Testing Conventions

Production-ready testing standards that prioritize simplicity, reliability, and maintainability across all applications.

## 🎯 Core Principles

- **Business Logic First** - Test what matters: user workflows, data integrity, error handling
- **Simple & Maintainable** - Readable tests that developers actually want to maintain
- **Production Ready** - Tests that catch real bugs, not code coverage theatre
- **Fast Feedback** - Quick unit tests, focused integration tests, targeted performance tests

## 📁 File Structure & Naming

### Co-located Testing

- Tests **MUST** live alongside source files
- Use `.test.ts` suffix: `userService.ts` → `userService.test.ts`
- Integration tests in `__tests__/` subdirectory: `__tests__/userWorkflow.integration.test.ts`

```
apps/backend/src/features/presentations/
├── presentation.service.ts
├── presentation.service.test.ts
└── __tests__/
    ├── presentation.integration.test.ts
    └── fixtures/
        └── mockPresentations.json
```

## 🧪 Test Categories

### 1. Unit Tests (Primary Focus)

- **Test business logic, validations, transformations**
- Mock external dependencies (APIs, databases, file systems)
- Fast execution (< 10ms per test)
- High coverage of critical paths

```typescript
describe("PresentationService", () => {
  it("should validate presentation schema before creation", () => {
    const invalidPresentation = { title: "" };

    expect(() => createPresentation(invalidPresentation)).toThrow(
      "Title is required",
    );
  });
});
```

### 2. Integration Tests (Selective)

- **Test critical user workflows end-to-end**
- Real database connections with test data
- API integration with mocked external services
- Focus on data flow and system boundaries

```typescript
describe("Presentation Creation Workflow", () => {
  it("should create presentation with slides and persist to database", async () => {
    const presentation = await createPresentationWorkflow({
      title: "Test Presentation",
      slides: mockSlideData,
    });

    expect(presentation.id).toBeDefined();
    expect(await getPresentationFromDb(presentation.id)).toBeTruthy();
  });
});
```

### 3. Performance Tests (Critical Paths Only)

- **Test performance-sensitive operations**
- Validate performance budgets
- Memory usage monitoring for batch operations

```typescript
describe("Slide Generation Performance", () => {
  it("should generate 50 slides within performance budget", async () => {
    const startTime = Date.now();

    await generateSlides(largePresentationData);

    const duration = Date.now() - startTime;
    expect(duration).toBeLessThan(5000); // 5 second budget
  });
});
```

## 🛠️ Testing Tools & Patterns

### Test Framework: Vitest

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
```

### Mocking Strategy

- **External APIs**: Always mock (Unsplash, OpenAI, Google APIs)
- **Database**: Mock for units, real for integration
- **File System**: Mock unless testing file operations
- **Internal Services**: Use real implementations

```typescript
// Mock external APIs
vi.mock("@google/slides", () => ({
  SlidesAPI: vi.fn().mockImplementation(() => ({
    presentations: {
      create: vi.fn().mockResolvedValue({ id: "mock-id" }),
    },
  })),
}));

// Real internal services
import { altFieldParser } from "./altFieldParser";
```

### Test Structure: AAA Pattern

```typescript
describe("Feature", () => {
  describe("specific behavior", () => {
    it("should do expected thing when given valid input", () => {
      // Arrange
      const input = { valid: "data" };
      const expectedOutput = { processed: "data" };

      // Act
      const result = processInput(input);

      // Assert
      expect(result).toEqual(expectedOutput);
    });
  });
});
```

## 🎯 What to Test

### ✅ Always Test

- **Business logic and transformations**
- **Input validation and sanitization**
- **Error handling and edge cases**
- **API contract compliance**
- **Security validations**
- **Performance-critical paths**

### ❌ Don't Test

- **Framework configuration** (Vitest, Hono setup)
- **Simple getters/setters**
- **Type-only interfaces**
- **Third-party library internals**
- **Generated code**

## 📊 Quality Standards

### Coverage Expectations

- **Critical services**: >90% line coverage
- **Business logic**: >85% branch coverage
- **Utility functions**: >95% line coverage
- **Integration workflows**: Key paths covered

### Test Quality Metrics

- **Readability**: Tests as documentation
- **Isolation**: No test interdependencies
- **Determinism**: Same input = same output
- **Performance**: Unit tests < 10ms, integration < 1s

## 🔧 Error Handling & Mocking

### Error Scenario Testing

```typescript
describe("error handling", () => {
  it("should handle API failure gracefully", async () => {
    vi.mocked(externalAPI.call).mockRejectedValue(new Error("API down"));

    const result = await serviceWithFallback();

    expect(result.success).toBe(false);
    expect(result.fallbackUsed).toBe(true);
  });
});
```

### Mock Consistency

- Use fixtures for consistent test data
- Mock at module boundaries, not implementation details
- Verify mock calls for side effects

```typescript
// Good: Mock at service boundary
vi.mock("./external/unsplashService");

// Bad: Mock internal implementation
vi.spyOn(service, "privateMethod");
```

## 🚀 Test Commands & Workflow

### Development Commands

```bash
pnpm test              # Run all tests
pnpm test:watch        # Watch mode
pnpm test:ui           # Visual test runner
pnpm test:run          # CI mode (no watch)
```

### Quality Check Integration

- Tests run as part of `pnpm qc` command
- All tests must pass before code completion
- Performance tests validate budgets
- Integration tests verify critical workflows

## 🎪 Test Data & Fixtures

### Fixture Organization

```typescript
// __tests__/fixtures/presentations.json
export const mockPresentations = {
  basic: { title: "Basic Presentation", slides: [] },
  withImages: { title: "With Images", slides: [mockSlideWithImage] },
  invalid: { title: "", slides: null },
};

// Use in tests
import { mockPresentations } from "./__tests__/fixtures/presentations";
```

### Dynamic Test Data

- Generate test data that covers edge cases
- Use realistic data that mirrors production
- Avoid brittle tests with hardcoded assumptions

## 🔐 Security Testing Standards

### Input Validation Testing

```typescript
describe("security validation", () => {
  it("should reject XSS in alt text", () => {
    const maliciousInput = '<script>alert("xss")</script>';

    expect(() => validateAltText(maliciousInput)).toThrow(
      "Invalid content detected",
    );
  });
});
```

### Authentication/Authorization Testing

- Test role-based access controls
- Validate JWT token handling
- Verify session management

## 🚫 Anti-Overengineering Rules

**Core Philosophy**: 20 well-designed tests that catch real bugs are infinitely more valuable than 60 redundant tests that only increase maintenance burden.

### 1. Zero-Value Tests (Never Write These)

#### ❌ Testing Type System Features

```typescript
// BAD: TypeScript already validates method existence
it("should have authenticateUser method", () => {
  expect(authService.authenticateUser).toBeDefined();
  expect(typeof authService.authenticateUser).toBe("function");
});
```

#### ❌ Testing Hardcoded Strings

```typescript
// BAD: Testing if hardcoded string contains expected substring
it("should use Bearer token format", () => {
  const format = "Authorization: Bearer <token>";
  expect(format).toContain("Bearer");
});
```

#### ❌ Placeholder Tests

```typescript
// BAD: Tests that don't actually test anything
it("should not use cookies", () => {
  expect(true).toBe(true);
});

it("should require authentication", () => {
  // This test documents expected behavior
  expect(true).toBe(true);
});
```

**Rule**: If a test doesn't execute production code and assert on its runtime behavior, delete it.

### 2. No Duplicate Tests

#### ❌ Same Logic, Same Mocks, Different File

```typescript
// File: userService.test.ts
it("should create user with valid data", async () => {
  vi.mocked(db.insert).mockResolvedValue({ id: "123" });
  const result = await createUser({ email: "test@example.com" });
  expect(result.id).toBe("123");
});

// File: __tests__/userService.integration.test.ts (DUPLICATE!)
it("should create user successfully", async () => {
  vi.mocked(db.insert).mockResolvedValue({ id: "123" });
  const result = await createUser({ email: "test@example.com" });
  expect(result).toHaveProperty("id");
});
```

**Rule**: One test per unique behavior. If two tests have identical setup and mocks, they're duplicates.

#### ❌ Redundant Integration Test Files

```typescript
// If you're mocking everything, it's not an integration test
// File: __tests__/auth.integration.test.ts
vi.mock("../authService"); // Mocking
vi.mock("../../userService"); // Mocking
vi.mock("../../../db"); // Mocking

// This is just a unit test in the wrong directory!
```

**Rule**: Integration tests must integrate real components. If everything is mocked, it's a unit test.

#### ❌ Testing Same Error Path Multiple Ways

```typescript
// BAD: Three tests for one error path
it("should reject null user", () => {
  expect(() => validate(null)).toThrow("Invalid user");
});

it("should reject undefined user", () => {
  expect(() => validate(undefined)).toThrow("Invalid user");
});

it("should reject missing user", () => {
  expect(() => validate()).toThrow("Invalid user");
});

// GOOD: Parameterized test
it.each([null, undefined, ""])("should reject invalid user: %s", (input) => {
  expect(() => validate(input)).toThrow("Invalid user");
});
```

**Rule**: Use `it.each()` for same validation logic with different inputs.

### 3. Test at the Correct Level

#### ❌ Testing Services in Endpoint Tests

```typescript
// File: endpoints.test.ts
describe("GET /api/users/:id", () => {
  it("should return user data", async () => {
    // BAD: Calling service directly instead of HTTP endpoint
    const user = await userService.getUserById("123");
    expect(user.id).toBe("123");
  });
});
```

#### ✅ Actually Test the Endpoint

```typescript
// GOOD: Testing the endpoint
describe("GET /api/users/:id", () => {
  it("should return user data", async () => {
    const response = await request(app)
      .get("/api/users/123")
      .set("Authorization", "Bearer valid-token");

    expect(response.status).toBe(200);
    expect(response.body.data.user.id).toBe("123");
  });
});
```

**Rule**:

- **Unit tests** → Test functions/classes/services
- **Integration tests** → Test HTTP endpoints/database flows/external APIs
- **Don't mix levels** → If the test name says "endpoint" but calls a service, it's wrong

### 4. Use Parameterization Aggressively

#### ❌ Repetitive Role Tests

```typescript
it("should allow admin role", () => {
  /* ... */
});
it("should allow support role", () => {
  /* ... */
});
it("should allow moderator role", () => {
  /* ... */
});
it("should reject user role", () => {
  /* ... */
});
```

#### ✅ Single Parameterized Test

```typescript
it.each([
  { role: "admin", shouldPass: true },
  { role: "support", shouldPass: true },
  { role: "moderator", shouldPass: true },
  { role: "user", shouldPass: false },
])(
  "should handle role $role (expects: $shouldPass)",
  ({ role, shouldPass }) => {
    const result = checkAccess(role);
    expect(result).toBe(shouldPass);
  },
);
```

**When to Parameterize**:

- Testing same validation with different inputs
- Testing multiple roles/permissions
- Testing various error conditions
- Testing boundary values

**When NOT to Parameterize**:

- Different code paths (happy path vs error cases)
- Different business logic
- Different test setups

### 5. Quality Over Quantity

**Value Metrics**:

- ✅ **Tests unique behavior**: Each test validates something no other test validates
- ✅ **Catches real bugs**: Removing this test would reduce coverage meaningfully
- ✅ **Documents intent**: Test name clearly describes business requirement
- ✅ **Fast feedback**: Test runs in < 10ms (unit) or < 1s (integration)

**Red Flags**:

- ❌ "This test is just for coverage" → Delete it
- ❌ "This test is similar to test X but with Y changed" → Parameterize it
- ❌ "This test documents expected behavior" → That's what comments are for
- ❌ "We should test this just in case" → If you can't articulate what bug it catches, delete it

### 6. Mandatory Pre-Commit Checklist

Before finalizing any test suite, verify:

1. **No Zero-Value Tests**
   - [ ] Every test executes production code
   - [ ] No tests of type system features
   - [ ] No tests of hardcoded strings

2. **No Duplicates**
   - [ ] Each test has unique setup or assertions
   - [ ] No redundant integration test files
   - [ ] Similar tests are parameterized

3. **Correct Level**
   - [ ] Unit tests test units
   - [ ] Integration tests integrate real components
   - [ ] Test names match what's actually being tested

4. **Optimal Coverage**
   - [ ] 20-30 tests for a service (not 60+)
   - [ ] Each test adds unique validation value
   - [ ] Can explain what bug each test prevents

## Key Rules

- **Production Focus**: Test real user scenarios, not code coverage metrics
- **Simple Patterns**: Consistent structure that any developer can follow
- **Fast Feedback**: Optimize for developer productivity
- **Business Value**: Ensure tests catch bugs that affect users
- **Maintainable**: Tests should help, not hinder, code evolution
