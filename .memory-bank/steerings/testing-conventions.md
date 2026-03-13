# Testing Conventions

Production-ready testing standards that prioritize simplicity, reliability, and maintainability.

## Core Principles

- **Business Logic First** — Test what matters: user workflows, data integrity, error handling
- **Simple & Maintainable** — Readable tests that developers actually want to maintain
- **Production Ready** — Tests that catch real bugs, not code coverage theatre
- **Fast Feedback** — Quick unit tests, focused integration tests
- **Test critical paths** — Focus coverage on business-critical code, not arbitrary thresholds

## File Structure & Naming

### Co-located Testing

- Tests **MUST** live alongside source files or in a `__tests__/` subdirectory
- Use `.test.ts` suffix: `bnovo-client.ts` → `bnovo-client.test.ts`
- Integration tests in `__tests__/` subdirectory: `__tests__/api.test.ts`

## Test Categories

### 1. Unit Tests (Primary Focus)

- **Test business logic, validations, transformations**
- Mock external dependencies (APIs, file systems)
- Fast execution (< 10ms per test)
- High coverage of critical paths

```typescript
describe("date validation", () => {
  it("should reject reversed date range", () => {
    const result = validateDates("15-03-2026", "10-03-2026");
    expect(result.success).toBe(false);
  });
});
```

### 2. Integration Tests (Selective)

- **Test critical user workflows end-to-end**
- API integration with mocked external services
- Focus on data flow and system boundaries
- Use Supertest for HTTP endpoint testing

```typescript
describe("GET /api/rooms", () => {
  it("should return rooms for valid date range", async () => {
    vi.mocked(bnovoClient.get).mockResolvedValue({ data: { rooms: mockRooms } });

    const response = await request(app)
      .get("/api/rooms?dfrom=10-03-2026&dto=15-03-2026");

    expect(response.status).toBe(200);
    expect(response.body).toBeInstanceOf(Array);
  });
});
```

## Testing Tools & Patterns

### Test Framework: Vitest

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
```

- **Backend**: Vitest + Supertest for integration tests
- **Frontend**: No test runner in MVP (quality checked via `npm run qc` — ESLint + TypeScript only)

### Mocking Strategy

- **External APIs**: Always mock (Bnovo API calls via bnovoClient)
- **Internal Services**: Use real implementations when possible
- Mock at module boundaries, not implementation details

```typescript
// Good: Mock at service boundary
vi.mock("../services/bnovo-client");

// Bad: Mock internal implementation
vi.spyOn(service, "privateMethod");
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

## What to Test

### Always Test

- **Business logic and transformations**
- **Input validation and sanitization**
- **Error handling and edge cases**
- **API contract compliance**

### Don't Test

- **Framework configuration** (Vitest, Express setup)
- **Simple getters/setters**
- **Type-only interfaces**
- **Third-party library internals**
- **Generated code**

## Test Commands

```bash
cd backend && npm test       # Run all tests once
```

Tests run as part of quality checks — all tests must pass before code completion.

## Anti-Overengineering Rules

**Core Philosophy**: 20 well-designed tests that catch real bugs are infinitely more valuable than 60 redundant tests that only increase maintenance burden.

### 1. Zero-Value Tests (Never Write These)

- Testing type system features (method existence, typeof checks)
- Testing hardcoded strings
- Placeholder tests (`expect(true).toBe(true)`)

**Rule**: If a test doesn't execute production code and assert on its runtime behavior, delete it.

### 2. No Duplicate Tests

- Each test must have unique setup or assertions
- If two tests have identical setup and mocks, they're duplicates
- If everything is mocked, it's a unit test — don't put it in an integration test file

### 3. Test at the Correct Level

- **Unit tests** → Test functions/classes/services
- **Integration tests** → Test HTTP endpoints/database flows/external APIs
- **Don't mix levels** → If the test name says "endpoint" but calls a service, it's wrong

### 4. Use Parameterization Aggressively

```typescript
it.each([null, undefined, ""])("should reject invalid user: %s", (input) => {
  expect(() => validate(input)).toThrow("Invalid user");
});
```

**When to Parameterize**: Same validation with different inputs, multiple error conditions, boundary values.

**When NOT to Parameterize**: Different code paths, different business logic, different test setups.

### 5. Quality Over Quantity

- Each test validates something no other test validates
- Each test catches a real bug — if you can't articulate what, delete it
- Test name clearly describes business requirement
- Fast feedback: unit < 10ms, integration < 1s

### 6. Pre-Commit Checklist

1. Every test executes production code (no zero-value tests)
2. Each test has unique setup or assertions (no duplicates)
3. Test names match what's actually being tested (correct level)
4. Can explain what bug each test prevents

## Key Rules

- **Production Focus**: Test real user scenarios, not code coverage metrics
- **Simple Patterns**: Consistent structure that any developer can follow
- **Fast Feedback**: Optimize for developer productivity
- **Business Value**: Ensure tests catch bugs that affect users
- **Maintainable**: Tests should help, not hinder, code evolution
