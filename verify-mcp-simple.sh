#!/bin/bash

# Simple MCP Server Verification Script

echo "========================================"
echo "MCP Server Status Check"
echo "========================================"
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}1. Running MCP Server Processes${NC}"
echo "----------------------------------------"
ps aux | grep -E 'mcp-server|vercel-mcp|flyio-mcp|chat-claude-server|@modelcontextprotocol|@playwright' | grep -v grep | while read -r line; do
    echo -e "${GREEN}✓${NC} $(echo "$line" | awk '{print $11, $12, $13}')"
done

# Check if any processes are running
if ! ps aux | grep -E 'mcp-server|vercel-mcp|flyio-mcp|chat-claude-server|@modelcontextprotocol|@playwright' | grep -v grep > /dev/null; then
    echo -e "${RED}✗ No MCP server processes detected${NC}"
    echo -e "${YELLOW}Note: This is normal when Claude Code is not running${NC}"
fi

echo ""
echo -e "${BLUE}2. Expected MCP Servers (from global config)${NC}"
echo "----------------------------------------"
if [ -f "$HOME/.claude/mcp.json" ]; then
    echo -e "${GREEN}✓${NC} Global configuration file found"
    echo ""
    echo "Configured servers:"
    cat "$HOME/.claude/mcp.json" | grep -oP '"[a-zA-Z0-9_-]+"\s*:\s*\{' | grep -oP '"[^"]+' | tr -d '"' | grep -v "mcpServers\|env" | sort -u | while read -r server; do
        echo "  - $server"
    done
    echo ""
    TOTAL_SERVERS=$(cat "$HOME/.claude/mcp.json" | grep -oP '"[a-zA-Z0-9_-]+"\s*:\s*\{' | grep -oP '"[^"]+' | tr -d '"' | grep -v "mcpServers\|env" | wc -l)
    echo -e "${BLUE}Total configured: $TOTAL_SERVERS servers${NC}"
else
    echo -e "${RED}✗ Global mcp.json not found at ~/.claude/mcp.json${NC}"
fi

echo ""
echo -e "${BLUE}3. Required Dependencies${NC}"
echo "----------------------------------------"

# Check Node.js
if command -v node &> /dev/null; then
    echo -e "${GREEN}✓${NC} Node.js: $(node --version) at $(which node)"
else
    echo -e "${RED}✗${NC} Node.js: NOT FOUND"
fi

# Check npx
if command -v npx &> /dev/null; then
    echo -e "${GREEN}✓${NC} npx: Available at $(which npx)"
else
    echo -e "${RED}✗${NC} npx: NOT FOUND"
fi

# Check Vercel CLI
if command -v vercel &> /dev/null; then
    echo -e "${GREEN}✓${NC} Vercel CLI: $(vercel --version) at $(which vercel)"
else
    echo -e "${YELLOW}!${NC} Vercel CLI: Not installed (install with: npm i -g vercel)"
fi

# Check Fly.io CLI
if command -v flyctl &> /dev/null; then
    echo -e "${GREEN}✓${NC} Fly.io CLI: $(flyctl version) at $(which flyctl)"
else
    echo -e "${YELLOW}!${NC} Fly.io CLI: Not installed (install with: curl -L https://fly.io/install.sh | sh)"
fi

echo ""
echo -e "${BLUE}4. MCP Server Files${NC}"
echo "----------------------------------------"

# Check if server files exist
if [ -d "mcp-servers" ]; then
    echo -e "${GREEN}✓${NC} mcp-servers/ directory exists"

    for file in vercel-mcp-wrapper.js flyio-mcp-wrapper.js chat-claude/chat-claude-server.js; do
        if [ -f "mcp-servers/$file" ]; then
            echo -e "${GREEN}✓${NC} mcp-servers/$file"
        else
            echo -e "${RED}✗${NC} mcp-servers/$file NOT FOUND"
        fi
    done
else
    echo -e "${RED}✗${NC} mcp-servers/ directory NOT FOUND"
fi

echo ""
echo -e "${BLUE}5. Process Details${NC}"
echo "----------------------------------------"
echo "Full process information for running MCP servers:"
echo ""

ps aux | grep -E 'mcp-server|vercel-mcp|flyio-mcp|chat-claude-server' | grep -v grep | while read -r line; do
    pid=$(echo "$line" | awk '{print $2}')
    cmd=$(echo "$line" | awk '{for(i=11;i<=NF;i++) printf $i" "; print ""}')
    echo "PID: $pid"
    echo "CMD: $cmd"
    echo "---"
done

if ! ps aux | grep -E 'mcp-server|vercel-mcp|flyio-mcp|chat-claude-server' | grep -v grep > /dev/null; then
    echo -e "${YELLOW}No running processes found${NC}"
    echo ""
    echo "This is expected if Claude Code is not currently running."
    echo "MCP servers are started automatically when Claude Code starts."
fi

echo ""
echo "========================================"
echo "Verification Complete"
echo "========================================"
echo ""
echo "To test MCP servers when Claude Code is running:"
echo "1. The servers should appear in the process list above"
echo "2. Check Claude Code output for 'MCP server running on stdio' messages"
echo "3. Try using MCP tools prefixed with mcp__ in Claude Code"
echo ""
