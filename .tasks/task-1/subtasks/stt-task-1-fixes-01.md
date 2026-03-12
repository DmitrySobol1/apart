## Overview

Fix backend Vitest CommonJS/ESM module compatibility issue preventing tests from running.

## References

- .tasks/task-1/subtasks/index.md
- .tasks/task-1/plan.md
- Validator output: backend tests fail with "Vitest cannot be imported in a CommonJS module using require()"

## What to fix

The backend's tsconfig compiles TypeScript to CommonJS, but Vitest requires ESM. The compiled test file (dist/__tests__/api.test.js) uses require() to import Vitest, which fails. Fix the Vitest configuration so tests run properly without conflicting with the backend's CommonJS build target.

## Agent

Code Implementer

## Definition of Done

- `npm test` in backend/ passes all 22 tests successfully
- `npm run build` in backend/ still works correctly
- `npm run qc` in backend/ still passes
