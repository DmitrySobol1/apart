#!/bin/bash
# =============================================================================
# Universal Stop Hook Wrapper for Claude Code
# =============================================================================
# Purpose: Runs QC checks when Claude stops and feeds errors back to context
# Usage:   STOP_HOOK_CMD="your command" bash stop-hook.sh
#
# Exit codes (per Claude Code docs):
#   0 = Success, Claude can stop
#   2 = Blocking error, stderr is fed to Claude's context (Claude must continue)
#
# The hook receives JSON on stdin with session info including:
#   { "stop_hook_active": true/false, "session_id": "...", ... }
# =============================================================================

# Default command if STOP_HOOK_CMD not set
COMMAND="${STOP_HOOK_CMD:-pnpm qc:wrapped}"

# Read JSON input from Claude Code (contains session metadata)
INPUT=$(cat)

# Extract stop_hook_active flag using jq
# This flag is TRUE when Claude is already continuing due to a previous stop hook
STOP_HOOK_ACTIVE=$(echo "$INPUT" | jq -r '.stop_hook_active // false')

# Prevent infinite loop:
# If stop_hook_active=true, Claude already tried to stop once and we blocked it.
# Blocking again would create: Claude fixes -> Stop -> Hook blocks -> Claude fixes -> ...
# So we allow stopping on the second attempt.
if [ "$STOP_HOOK_ACTIVE" = "true" ]; then
  exit 0
fi

# Run the QC command and capture both stdout and stderr
OUTPUT=$($COMMAND 2>&1)
EXIT_CODE=$?

# If command failed, output to stderr and exit with code 2 (blocking)
# Exit code 2 tells Claude Code to feed stderr to Claude's context
# This allows Claude to see the error and fix it automatically
if [ $EXIT_CODE -ne 0 ]; then
  echo "$OUTPUT" >&2
  exit 2
fi

# Success - allow Claude to stop
exit 0
