---
name: e2e
description: Run e2e tests via browser automation using chrome-devtools MCP
---

# E2E Testing Skill

## Purpose

Execute end-to-end tests by controlling a browser via chrome-devtools MCP. Tests follow user journeys and produce pass/fail reports.

## Usage

```
/e2e <journey-spec>
```

Where `<journey-spec>` is either:
- Inline description: `/e2e test login flow on localhost:5001`
- Path to journey file: `/e2e @.memory-bank/product/user-journeys/index.md#section-6`

## Workflow

```
1. Parse journey spec (inline or file)
2. Extract: URLs, steps, expected outcomes
3. Launch Browser Test Agent (sequentially for each journey)
4. Collect reports
5. Present summary to user
```

## Orchestrator Role

You are the **E2E Test Orchestrator**. You:
- Parse user request to identify journeys to test
- Invoke Browser Test Agent for each journey
- Aggregate results into summary
- Report findings to user

## Invoking Browser Test Agent

For each journey, invoke Task tool with:
- `subagent_type`: "general-purpose"
- `model`: "sonnet"
- Include full BROWSER_AGENT.md instructions in prompt
- Include journey spec with steps and expected outcomes

**Prompt template:**

```
<browser-agent-instructions>
{contents of BROWSER_AGENT.md}
</browser-agent-instructions>

<journey>
Name: {journey name}
Base URL: {url}
Steps:
{numbered steps with expected outcomes}
</journey>

Execute this journey and return structured report.
```

## Report Format

Each agent returns:

```markdown
## {Journey Name}

**Status**: PASSED | FAILED | PARTIAL

### Steps
1. {step} - {status} - {details}
2. ...

### Issues Found
- {severity}: {description}

### Console Errors
- {errors if any}

### Screenshots
- {paths if saved}
```

## Summary Format

After all journeys complete:

```markdown
# E2E Test Summary

| Journey | Status | Issues |
|---------|--------|--------|
| {name}  | {status} | {count} |

## Critical Issues
{list if any}

## Recommendations
{optional fixes}
```
