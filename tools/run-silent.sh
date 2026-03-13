run_silent() {
    local description="$1"
    local command="$2"
    local tmp_file=$(mktemp)
    echo $command

    if eval "$command" > "$tmp_file" 2>&1; then
        printf "  ✓ %s\n" "$description"
        rm -f "$tmp_file"
        return 0
    else
        local exit_code=$?
        printf "  ✗ %s\n" "$description" >&2
        cat "$tmp_file" >&2
        rm -f "$tmp_file"
        return $exit_code
    fi
}

run_silent "$1" "$2"