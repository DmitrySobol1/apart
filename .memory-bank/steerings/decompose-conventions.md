---
status: ✅ ACTIVE
type: conventions
name: decompose-conventions.md
description: Task decomposition rules for breaking down implementation plans into executable subtasks.
last_updated: 2025-09-25
---

# Decompose Conventions

## Input & Output

**Input:** `.tasks/[TASK-ID]/plan.md`
**Output:**

- `.tasks/[TASK-ID]/subtasks/index.md` (ordered task list)
- `.tasks/[TASK-ID]/subtasks/stt-[id].md` (individual subtasks)

## Task Structure

Each subtask must contain:

### Goal

Clear, single outcome statement (what will be achieved)

### Details

Specific details for this task from `plan.md`

### Tech Requirements

- Specific technologies, frameworks, libraries needed
- Dependencies on other tasks
- Size constraints (≤600 LOC per file)

### Acceptance Criteria

- Measurable success conditions

### Refs

- Link to `.tasks/task-N/subtasks/index.md`
- Link to `plan.md`
- Any relevant `.memory-bank/` documentation

## Core Rules

- **Single outcome per task** - no mixing multiple concerns
- **Sequential execution** - tasks run one at a time
- **Vertical slices** - each task produces verifiable value
- **No feature flags** - use preview branches or unlinked routes instead
- **Agent assignment** - specify responsible agent (Code Implementer, Test Writer, Documentation Writer)
- Time constraint (≤3-4 hours of SWE work per subtask)
- **Maximum 10 subtasks per task** - if decomposition requires more than 10 subtasks, STOP and report to user that the task is too large and needs to be broken down into multiple high-level tasks first

### Fix Task Conventions

- Prefer a single aggregated fix subtask per audit iteration: `STT-{TASK-ID}-fixes-{NN}.md`.
- Aggregate related issues by component with concise actions and a clear Definition of Done.
- Split into multiple fix subtasks only when issues are clearly separable or owned by different agents.

## Task Types

- `feature` - End-to-end capability increment
- `fix` - Fix issue
- `eval` - Testing/measurement with specific thresholds
- `doc` - Documentation updates required by features

## Naming Pattern

`[type] / [outcome] — [deliverable] — [key constraint]`

Examples:

- `feature / User login — POST /auth/login endpoint — JWT tokens`
- `eval / Response quality — test harness — accuracy ≥85%`
- `spike / Database choice — decision note — performance requirements`

## Index.md Format

```markdown
- [ ] stt-001 | Code Implementer | Title
      Description of what this task accomplishes

- [ ] stt-002 | Test Writer | Title
      Description of what this task accomplishes
```

## Ordering Priority

1. Baseline/eval before changes
2. Documentation before implementation
3. Risk retirement (spikes) early
4. Data changes (expand first, contract last)
5. Walking skeleton first (thin end-to-end capability)
