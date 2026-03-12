# Quality and Style

## Intent
Maintain code quality and consistency in the Apart-Hotel Booking Widget project.

## Rules
1. ESLint SHALL be used for linting and static analysis (to be configured in stt-001)
2. Prettier SHALL be used for code formatting (to be configured in stt-001)
3. Console logging is allowed for MVP (booking data, server start, errors)
4. Quality gates SHALL be enforced through quality check commands

## Practices

### Code Formatting
- Prettier for consistent formatting
- Automatic formatting on save when possible
- Consistent indentation and spacing across all files

### Linting and Static Analysis
- ESLint with TypeScript support
- Applied across both frontend/ and backend/
- Focus on catching potential bugs and maintaining code consistency

### Logging Strategy (MVP)
```typescript
console.log('Server started on port', port)
console.log('Booking received:', bookingData)
console.error('Bnovo API error:', error.message)
```
- Console logging is sufficient for MVP
- Post-MVP: introduce structured logging if needed

### Quality Process
- Run quality check command before completing tasks
- TypeScript strict mode for type safety
- Build verification for both packages

## Status
> **Note:** Specific tooling (ESLint, Prettier configs) will be set up during project initialization (stt-001). Commands will be documented in `project-commands.md` after initialization.

## Meta
- **Scope**: Code formatting, linting, logging, quality assurance
- **Project**: Apart-Hotel Booking Widget (apart-nn.ru)
