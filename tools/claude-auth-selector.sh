#!/bin/zsh
# This script is intended to be sourced by Zsh.

# Custom claude function to select auth method using a simple numeric menu.
claude() {
    # Check if an auth choice has already been made in this shell session
    if [ -z "$CLAUDE_AUTH_CHOICE" ]; then
        echo "Choose authentication method for this session:"
        # Loop until the user makes a valid choice
        while true; do
            read -r "choice? (1) Subscription  (2) AWS Bedrock  (3) z.ai: "
            case "$choice" in
                1)
                    export CLAUDE_AUTH_CHOICE="subscription"
                    echo "Using Subscription auth for this session."
                    break # Exit the loop
                    ;;
                2)
                    export CLAUDE_AUTH_CHOICE="bedrock"
                    echo "Using AWS Bedrock for this session."
                    break # Exit the loop
                    ;;
                3)
                    export CLAUDE_AUTH_CHOICE="zai"
                    echo "Using z.ai for this session."
                    break # Exit the loop
                    ;;
                *)
                    # If input is anything else, print an error and the loop continues
                    echo "Invalid choice. Please enter 1, 2, or 3."
                    ;;
            esac
        done
        echo # Add a newline for cleaner output
    fi

    # Execute the actual claude command with the chosen authentication
    if [ "$CLAUDE_AUTH_CHOICE" = "bedrock" ]; then
        # IMPORTANT: Remember to use your actual AWS profile name here
        (
            export CLAUDE_CODE_USE_BEDROCK=1
            export AWS_PROFILE="claude-code"
            export MAX_THINKING_TOKENS=1024
            export ANTHROPIC_SMALL_FAST_MODEL="us.anthropic.claude-haiku-4-5-20251001-v1:0"
            export ANTHROPIC_MODEL="us.anthropic.claude-sonnet-4-5-20250929-v1:0"
            export ANTHROPIC_DEFAULT_OPUS_MODEL="us.anthropic.claude-opus-4-1-20250805-v1:0"
            command claude "$@")
    elif [ "$CLAUDE_AUTH_CHOICE" = "zai" ]; then
        # Set environment variables for z.ai
        (
            export ANTHROPIC_AUTH_TOKEN=""
            export ANTHROPIC_BASE_URL="https://api.z.ai/api/anthropic"
            export API_TIMEOUT_MS="3000000"
            export ANTHROPIC_DEFAULT_HAIKU_MODEL="glm-4.6"
            export ANTHROPIC_DEFAULT_SONNET_MODEL="glm-4.6"
            export ANTHROPIC_DEFAULT_OPUS_MODEL="glm-4.6"
            command claude "$@"
        )
    else
        # Unset the bedrock variable to ensure subscription auth is used
        (unset CLAUDE_CODE_USE_BEDROCK && command claude "$@")
    fi
}

# Function to reset the claude auth choice for the current session
claude-reset() {
    unset CLAUDE_AUTH_CHOICE
    echo "Claude authentication choice has been reset."
    echo "Run 'claude' again to select a new method for this session."
}