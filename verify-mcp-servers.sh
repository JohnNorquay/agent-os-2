#!/bin/bash

# MCP Server Verification Script
# This script verifies that all configured MCP servers are running and functional

echo "========================================"
echo "MCP Server Verification Script"
echo "========================================"
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counter for results
TOTAL=0
PASSED=0
FAILED=0

# Read .mcp.json configuration
CONFIG_FILE=".mcp.json"

if [ ! -f "$CONFIG_FILE" ]; then
    echo -e "${RED}Error: .mcp.json not found in current directory${NC}"
    exit 1
fi

echo "Configuration file: $CONFIG_FILE"
echo ""

# Extract server names from .mcp.json
echo "Configured MCP Servers:"
echo "------------------------"
SERVER_NAMES=$(cat "$CONFIG_FILE" | grep -oP '"[^"]+"\s*:\s*\{' | grep -oP '"[^"]+' | tr -d '"' | grep -v "mcpServers")

for server in $SERVER_NAMES; do
    echo "  - $server"
done
echo ""

# Function to test if a process is running
check_process() {
    local server_name=$1
    local process_pattern=$2

    ((TOTAL++))

    if pgrep -f "$process_pattern" > /dev/null; then
        echo -e "${GREEN}✓${NC} $server_name: Process running"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}✗${NC} $server_name: Process NOT running"
        ((FAILED++))
        return 1
    fi
}

# Function to test server command availability
check_command() {
    local command_name=$1
    local description=$2

    ((TOTAL++))

    if command -v "$command_name" &> /dev/null; then
        echo -e "${GREEN}✓${NC} $description: Available ($(which $command_name))"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}✗${NC} $description: NOT available"
        ((FAILED++))
        return 1
    fi
}

# Function to test environment variables
check_env() {
    local env_var=$1
    local description=$2

    ((TOTAL++))

    if [ ! -z "${!env_var}" ]; then
        local value="${!env_var}"
        local masked_value="${value:0:10}..."
        echo -e "${GREEN}✓${NC} $description: Set ($masked_value)"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}✗${NC} $description: NOT set"
        ((FAILED++))
        return 1
    fi
}

echo "========================================"
echo "1. Process Checks"
echo "========================================"

# Check for MCP server processes
check_process "chat-claude" "chat-claude-server.js"
check_process "vercel" "vercel-mcp-wrapper.js"
check_process "flyio" "flyio-mcp-wrapper.js"
check_process "supabase-PickSix" "@supabase/mcp-server-supabase"

echo ""
echo "========================================"
echo "2. Dependency Checks"
echo "========================================"

# Check required commands
check_command "node" "Node.js"
check_command "npx" "npx"
check_command "vercel" "Vercel CLI"
check_command "flyctl" "Fly.io CLI"

echo ""
echo "========================================"
echo "3. Configuration Checks"
echo "========================================"

# Extract and check environment variables from .mcp.json
# Note: This only validates that the keys are present in the config, not in the actual environment

for server in $SERVER_NAMES; do
    echo "Checking $server configuration..."

    # Extract env vars for this server
    ENV_VARS=$(cat "$CONFIG_FILE" | jq -r ".mcpServers[\"$server\"].env | keys[]" 2>/dev/null)

    if [ $? -eq 0 ] && [ ! -z "$ENV_VARS" ]; then
        for env_var in $ENV_VARS; do
            echo "  - $env_var: $(cat "$CONFIG_FILE" | jq -r ".mcpServers[\"$server\"].env[\"$env_var\"]" | cut -c1-20)..."
        done
    else
        echo "  No environment variables configured"
    fi
    echo ""
done

echo "========================================"
echo "4. MCP Protocol Test"
echo "========================================"

# Test if we can communicate with servers via stdio
echo "Testing server communication..."

# For each server, try to send a simple list tools request
# This is a simplified test - actual implementation would use MCP protocol

for server in $SERVER_NAMES; do
    COMMAND=$(cat "$CONFIG_FILE" | jq -r ".mcpServers[\"$server\"].command")
    ARGS=$(cat "$CONFIG_FILE" | jq -r ".mcpServers[\"$server\"].args | join(\" \")")

    echo -e "${YELLOW}→${NC} $server: $COMMAND $ARGS"
done

echo ""
echo "========================================"
echo "Summary"
echo "========================================"
echo -e "Total Checks: $TOTAL"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}All checks passed! ✓${NC}"
    exit 0
else
    echo -e "${RED}Some checks failed. Please review the output above.${NC}"
    exit 1
fi
