#!/usr/bin/env node

/**
 * Vercel MCP Server
 * Wraps Vercel CLI commands in MCP protocol
 */

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { z } = require('zod');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

// Environment variable for Vercel token
const VERCEL_TOKEN = process.env.VERCEL_TOKEN || '';

/**
 * Execute Vercel CLI command
 */
async function execVercel(args) {
  const cmd = `vercel ${args}`;
  const env = { ...process.env };
  if (VERCEL_TOKEN) {
    env.VERCEL_TOKEN = VERCEL_TOKEN;
  }
  
  try {
    const { stdout, stderr } = await execAsync(cmd, { env, maxBuffer: 1024 * 1024 * 10 });
    return { stdout, stderr, success: true };
  } catch (error) {
    return { 
      stdout: error.stdout || '', 
      stderr: error.stderr || error.message, 
      success: false 
    };
  }
}

// Create MCP server
const server = new Server(
  {
    name: 'vercel-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List deployments
server.setRequestHandler('tools/list', async () => {
  return {
    tools: [
      {
        name: 'vercel_list_deployments',
        description: 'List all Vercel deployments',
        inputSchema: {
          type: 'object',
          properties: {
            project: {
              type: 'string',
              description: 'Filter by project name (optional)',
            },
            limit: {
              type: 'number',
              description: 'Number of deployments to return (default: 20)',
            },
          },
        },
      },
      {
        name: 'vercel_list_projects',
        description: 'List all Vercel projects',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'vercel_deploy',
        description: 'Deploy current directory to Vercel',
        inputSchema: {
          type: 'object',
          properties: {
            production: {
              type: 'boolean',
              description: 'Deploy to production (default: false)',
            },
            name: {
              type: 'string',
              description: 'Project name',
            },
          },
        },
      },
      {
        name: 'vercel_logs',
        description: 'Get deployment logs',
        inputSchema: {
          type: 'object',
          properties: {
            deployment: {
              type: 'string',
              description: 'Deployment URL or ID',
            },
            follow: {
              type: 'boolean',
              description: 'Follow logs in real-time',
            },
          },
          required: ['deployment'],
        },
      },
      {
        name: 'vercel_env',
        description: 'Manage environment variables',
        inputSchema: {
          type: 'object',
          properties: {
            action: {
              type: 'string',
              enum: ['list', 'add', 'remove'],
              description: 'Action to perform',
            },
            key: {
              type: 'string',
              description: 'Environment variable key (for add/remove)',
            },
            value: {
              type: 'string',
              description: 'Environment variable value (for add)',
            },
            environment: {
              type: 'string',
              enum: ['production', 'preview', 'development'],
              description: 'Target environment',
            },
          },
          required: ['action'],
        },
      },
      {
        name: 'vercel_domains',
        description: 'List or manage domains',
        inputSchema: {
          type: 'object',
          properties: {
            action: {
              type: 'string',
              enum: ['list', 'add', 'remove'],
              description: 'Action to perform',
            },
            domain: {
              type: 'string',
              description: 'Domain name (for add/remove)',
            },
          },
          required: ['action'],
        },
      },
      {
        name: 'vercel_inspect',
        description: 'Get detailed information about a deployment',
        inputSchema: {
          type: 'object',
          properties: {
            deployment: {
              type: 'string',
              description: 'Deployment URL or ID',
            },
          },
          required: ['deployment'],
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler('tools/call', async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'vercel_list_deployments': {
        let cmd = 'list';
        if (args.project) cmd += ` --scope ${args.project}`;
        if (args.limit) cmd += ` --limit ${args.limit}`;
        const result = await execVercel(cmd);
        return {
          content: [
            {
              type: 'text',
              text: result.success ? result.stdout : `Error: ${result.stderr}`,
            },
          ],
        };
      }

      case 'vercel_list_projects': {
        const result = await execVercel('projects list');
        return {
          content: [
            {
              type: 'text',
              text: result.success ? result.stdout : `Error: ${result.stderr}`,
            },
          ],
        };
      }

      case 'vercel_deploy': {
        let cmd = '--yes';
        if (args.production) cmd += ' --prod';
        if (args.name) cmd += ` --name ${args.name}`;
        const result = await execVercel(cmd);
        return {
          content: [
            {
              type: 'text',
              text: result.success ? result.stdout : `Error: ${result.stderr}`,
            },
          ],
        };
      }

      case 'vercel_logs': {
        let cmd = `logs ${args.deployment}`;
        if (args.follow) cmd += ' --follow';
        const result = await execVercel(cmd);
        return {
          content: [
            {
              type: 'text',
              text: result.success ? result.stdout : `Error: ${result.stderr}`,
            },
          ],
        };
      }

      case 'vercel_env': {
        let cmd = `env ${args.action}`;
        if (args.key) cmd += ` ${args.key}`;
        if (args.value) cmd += ` ${args.value}`;
        if (args.environment) cmd += ` ${args.environment}`;
        const result = await execVercel(cmd);
        return {
          content: [
            {
              type: 'text',
              text: result.success ? result.stdout : `Error: ${result.stderr}`,
            },
          ],
        };
      }

      case 'vercel_domains': {
        let cmd = `domains ${args.action}`;
        if (args.domain) cmd += ` ${args.domain}`;
        const result = await execVercel(cmd);
        return {
          content: [
            {
              type: 'text',
              text: result.success ? result.stdout : `Error: ${result.stderr}`,
            },
          ],
        };
      }

      case 'vercel_inspect': {
        const result = await execVercel(`inspect ${args.deployment}`);
        return {
          content: [
            {
              type: 'text',
              text: result.success ? result.stdout : `Error: ${result.stderr}`,
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error executing ${name}: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Vercel MCP server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
