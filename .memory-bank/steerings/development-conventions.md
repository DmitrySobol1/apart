# Project-Wide Development Conventions

Essential coding standards for the Apart-Hotel Booking Widget project (apart-nn.ru).

## Type Safety Standards

- **NEVER use `any` type** — Always define proper types or use `unknown`
- **Use strict TypeScript configuration** across frontend and backend
- **Runtime validation**: Use Zod for API input validation and configuration schemas
- **Types from Zod**: Infer TS types with `z.infer<typeof Schema>` and export when shared

## Project Structure

- **Minimize dependencies**: Add a library only if it saves significant effort and adds no heavy transitive risks
- For project-specific tech stack and structure, see `project_docs/architecture.md`

## Code Style

### Naming Conventions

- **Files**: kebab-case (`bnovo-client.ts`, `booking.routes.ts`)
- **Variables/Functions**: camelCase
- **Constants**: UPPER_SNAKE_CASE
- **Types/Interfaces**: PascalCase

### Code Architecture Preferences

- **Less code is better** — Reuse and modify existing code instead of creating new code
- **DRY (Don't Repeat Yourself)** — Extract common logic into reusable functions/modules
- **Code readable > clever** — Prioritize readability and maintainability
- **Prefer functions over classes** for business logic and utilities
- **Function parameters**: Use object destructuring for 3+ arguments
- **Type definitions location**: Define types at the top of the file or in separate `types/` files

### Data Flow Traceability

- **Immutable transformations** — Return new objects instead of modifying existing ones
- **Const by default** — Use `const` for variables; mutation should be intentional and local
- **Direct over clever** — Avoid excessive layers (adapters, wrappers, meta-programming)
- **No global mutable state** — Pass data explicitly through function parameters

## Configuration Management

- **Environment to config flow**: `.env` → validated config object → inject into services
- **No scattered process.env** — Read `process.env` only in a centralized config file (`config.ts`)
- **Centralized configuration** — Use a config object passed to services

## Error Handling & Validation

### Input Validation

- **Fail fast at boundaries** — Validate all inputs at API endpoints
- **Use Zod schemas** for runtime validation of API inputs

### Error Handling Policy

- **Throw with actionable messages** — Include meaningful error descriptions
- **Map internal errors** to safe HTTP statuses
- **Never leak secrets or stack traces** to clients
- **Handle obvious failures** with appropriate user feedback (null checks, invalid inputs, network timeouts)

## Logging Policy (MVP)

- **console.log is allowed** for MVP — booking data logging, server start, errors
- **console.error for errors** — API failures, validation errors
- Post-MVP: structured logging will be introduced

## Quality Assurance

- **Quality check commands**: Defined in `.memory-bank/project_docs/project-commands.md`
- **Build verification**: Both frontend and backend must build successfully
- **Type checking**: All applications must pass TypeScript compilation

## File Creation Policy

- **NEVER create files** unless absolutely necessary for achieving the goal
- **ALWAYS prefer editing** existing files over creating new ones
- **DO NOT ADD ANY COMMENTS** unless explicitly asked by user
- **Comments policy**: Explain why, not what

## Code Implementation Philosophy

### Business Logic Focus

- **Production-Ready by Default**: Write maintainable, deployable code focusing on core business logic
- **Avoid Overengineering**: Skip non-obvious edge cases, high-load optimizations
- **Handle Obvious Cases**: Include basic error handling for common failures
- **Enhancement on Request**: Only add advanced features when explicitly specified in plan

### Implementation Guidelines

- **Core Functionality First**: Implement the primary business requirement completely
- **Basic Error Handling**: Handle obvious failure cases with appropriate user feedback
- **No Premature Optimization**: Focus on correctness and clarity before performance
- **Standard Patterns**: Use established patterns rather than novel approaches

## Implementation Constraints

### Change Management

- **No unsolicited changes** — Do not modify code beyond instructions scope
- **Idempotency** — If changes already exist and comply with conventions, mark as completed
- **Enhancement by request only** — Only add advanced features when explicitly specified

### Context Acquisition Process

- **Read before modify** — Before modifying any file, read its current content
- **Load coding standards** — Reference this file before implementation
