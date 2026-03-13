# Fix Subtask: Admin panel type mismatch and API response unwrapping

## Overview

Fix two MAJOR issues found in audit-2026-03-13-04-45 that make the admin panel's Coefficients page non-functional at runtime.

## References

- Parent index: `.tasks/task-2/subtasks/index.md`
- Plan: `.tasks/task-2/plan.md`
- Audit report: `.tasks/task-2/audits/audit-2026-03-13-04-45.md` (lines 100-180)

## What to fix

### Issue 1 (MAJOR): `bnovoId` typed as `number` — should be `string`

In `admin/src/types/index.ts`, both `Room` and `Coefficient` interfaces declare `bnovoId: number`. The backend stores and returns `bnovoId` as a `string` (Mongoose schema: `type: String`). Fix by changing `bnovoId: number` to `bnovoId: string` in both interfaces. Also update `patchCoefficient` parameter type in `admin/src/api/client.ts` and any related code in `CoefficientsPage.tsx` that uses `bnovoId` as a number.

### Issue 2 (MAJOR): API client response envelope unwrapping is wrong

The backend wraps responses in `{ data: [...] }` but `getCoefficients()` and `getRooms()` in `admin/src/api/client.ts` only unwrap the Axios response (`.then(r => r.data)`), returning the envelope object `{ data: [...] }` instead of the array. This causes `CoefficientsPage` to crash when calling `.sort()` on the envelope object.

Fix response unwrapping in `admin/src/api/client.ts`:
- `getCoefficients`: unwrap to `r.data.data`
- `getRooms`: unwrap to `r.data.data`
- `patchCoefficient`: unwrap appropriately for `{ success, data }` envelope

### Issue 3 (MINOR): Deprecated Mongoose option in room-sync.ts

In `backend/src/services/room-sync.ts`, `findOneAndUpdate` is called with `{ new: false }` which is deprecated. Change to `{ returnDocument: 'before' }` or remove the option entirely (default behavior is the same).

## Agent

Code Implementer

## Definition of Done

1. `bnovoId` is typed as `string` in all admin frontend interfaces
2. `getCoefficients()` and `getRooms()` return arrays (not envelope objects)
3. `patchCoefficient` accepts `bnovoId: string`
4. Deprecated Mongoose option warning resolved
5. `npx tsc --noEmit` passes in admin/
6. `npm run qc` passes in backend/
7. `npm test` passes in backend/
