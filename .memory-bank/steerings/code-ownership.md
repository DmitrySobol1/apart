# Code Ownership

## Intent
Establish clear architectural boundaries and ownership patterns through package structure to minimize cognitive overhead and prevent coordination bottlenecks.

## Rules
1. All shared code (utilities, types, constants) SHALL be consolidated in the shared/ directory
2. Shared business logic and utilities SHALL be exported from the database package for cross-package consumption
3. Package structure SHALL define ownership boundaries - no explicit CODEOWNERS file needed
4. All modules SHALL use TypeScript path aliases for internal imports
5. New shared code MUST NOT be duplicated within individual packages

## Practices

### Package Organization
- shared/: All shared code including utilities, types, constants, and linting rules
- database/: Core data models and exports for shared utilities
- backend/: Server-side application code
- web/: Frontend application code
- Package boundaries clearly define ownership and responsibility

### Import Aliases
Use TypeScript path aliases for all internal module imports:
```typescript
import { UserModel } from '@tg-channel-stats/database'
import { routes } from '@backend/routes'
import { ingest } from '@backend/ingest'
```

### Shared Code Management
- Place reusable utilities in shared/ directory
- Export commonly used functions from database package
- Avoid code duplication across packages
- Maintain clear separation between domain-specific and shared code

## Meta
- **Scope**: Code organization, module ownership, import patterns
- **Task Types**: Architecture decisions, code placement, import structure
- **Session**: 7b84e2a0-1db1-4ee8-b5d3-8f4d6c7b2e1a
- **Dependencies**: TypeScript configuration, package structure