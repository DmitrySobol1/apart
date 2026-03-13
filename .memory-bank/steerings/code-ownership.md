# Code Ownership

## Intent
Establish clear architectural boundaries and ownership patterns through package structure to minimize cognitive overhead and prevent coordination bottlenecks.

## Rules
1. Package boundaries define ownership — no explicit CODEOWNERS file needed
2. No circular dependencies between packages
3. Shared types: duplicate minimal types in both packages when no shared package exists
4. New shared code should be placed where it is most naturally owned; duplication is acceptable when it avoids tight coupling
5. Minimize dependencies — add a library only if it saves significant effort and adds no heavy transitive risks

## Practices

### Package Organization
- Each package has its own `package.json`, `node_modules`, and scripts
- Package boundaries clearly define ownership and responsibility
- No root-level package orchestration in MVP (no Turborepo, no Nx)

### Import Patterns
- Use relative imports within a package
- No cross-package imports — each package is self-contained
- Keep import paths shallow and predictable

### Shared Code Management
- When two packages need the same type, duplicate the minimal interface in each
- Avoid premature extraction of shared packages — introduce only when duplication becomes a maintenance burden
- Maintain clear separation between domain-specific and shared code

## Meta
- **Scope**: Code organization, module ownership, import patterns
- **Task Types**: Architecture decisions, code placement, import structure
