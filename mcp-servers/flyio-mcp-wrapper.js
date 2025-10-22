#!/usr/bin/env node

/**
 * Fly.io MCP Server
 * Wraps flyctl commands in MCP protocol
 */

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { z } = require('zod');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

// Environment variable for Fly.io token
const FLY_API_TOKEN = process.env.FLY_API_TOKEN || '';

/**
 * Execute flyctl command
 */
async function execFly(args) {
  const cmd = `flyctl ${args}`;
  const env = { ...process.env };
  if (FLY_API_TOKEN) {
    env.FLY_API_TOKEN = FLY_API_TOKEN;
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
    name: 'flyio-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List tools
server.setRequestHandler('tools/list', async () => {
  return {
    tools: [
      {
        name: 'fly_list_apps',
        description: 'List all Fly.io applications',
        inputSchema: {
          type: 'object',
          properties: {
            org: {
              type: 'string',
              description: 'Filter by organization (optional)',
            },
          },
        },
      },
      {
        name: 'fly_app_status',
        description: 'Get status of a specific app',
        inputSchema: {
          type: 'object',
          properties: {
            app: {
              type: 'string',
              description: 'App name',
            },
          },
          required: ['app'],
        },
      },
      {
        name: 'fly_deploy',
        description: 'Deploy application to Fly.io',
        inputSchema: {
          type: 'object',
          properties: {
            app: {
              type: 'string',
              description: 'App name (optional, uses fly.toml if not specified)',
            },
            remote_only: {
              type: 'boolean',
              description: 'Build remotely (default: true)',
            },
            strategy: {
              type: 'string',
              enum: ['canary', 'rolling', 'immediate'],
              description: 'Deployment strategy',
            },
          },
        },
      },
      {
        name: 'fly_logs',
        description: 'Get application logs',
        inputSchema: {
          type: 'object',
          properties: {
            app: {
              type: 'string',
              description: 'App name',
            },
            instance: {
              type: 'string',
              description: 'Specific instance ID (optional)',
            },
            follow: {
              type: 'boolean',
              description: 'Follow logs in real-time',
            },
          },
          required: ['app'],
        },
      },
      {
        name: 'fly_scale',
        description: 'Scale application instances',
        inputSchema: {
          type: 'object',
          properties: {
            app: {
              type: 'string',
              description: 'App name',
            },
            count: {
              type: 'number',
              description: 'Number of instances',
            },
            region: {
              type: 'string',
              description: 'Specific region (optional)',
            },
          },
          required: ['app', 'count'],
        },
      },
      {
        name: 'fly_regions',
        description: 'List available regions or app regions',
        inputSchema: {
          type: 'object',
          properties: {
            app: {
              type: 'string',
              description: 'App name to see its regions (optional)',
            },
            list_available: {
              type: 'boolean',
              description: 'List all available regions',
            },
          },
        },
      },
      {
        name: 'fly_secrets',
        description: 'Manage application secrets',
        inputSchema: {
          type: 'object',
          properties: {
            action: {
              type: 'string',
              enum: ['list', 'set', 'unset'],
              description: 'Action to perform',
            },
            app: {
              type: 'string',
              description: 'App name',
            },
            key: {
              type: 'string',
              description: 'Secret key (for set/unset)',
            },
            value: {
              type: 'string',
              description: 'Secret value (for set)',
            },
          },
          required: ['action', 'app'],
        },
      },
      {
        name: 'fly_postgres_list',
        description: 'List Postgres databases',
        inputSchema: {
          type: 'object',
          properties: {
            org: {
              type: 'string',
              description: 'Filter by organization (optional)',
            },
          },
        },
      },
      {
        name: 'fly_postgres_connect',
        description: 'Get Postgres connection string',
        inputSchema: {
          type: 'object',
          properties: {
            app: {
              type: 'string',
              description: 'Postgres app name',
            },
          },
          required: ['app'],
        },
      },
      {
        name: 'fly_machine_list',
        description: 'List machines for an app',
        inputSchema: {
          type: 'object',
          properties: {
            app: {
              type: 'string',
              description: 'App name',
            },
          },
          required: ['app'],
        },
      },
      {
        name: 'fly_machine_stop',
        description: 'Stop a specific machine',
        inputSchema: {
          type: 'object',
          properties: {
            app: {
              type: 'string',
              description: 'App name',
            },
            machine_id: {
              type: 'string',
              description: 'Machine ID',
            },
          },
          required: ['app', 'machine_id'],
        },
      },
      {
        name: 'fly_machine_start',
        description: 'Start a specific machine',
        inputSchema: {
          type: 'object',
          properties: {
            app: {
              type: 'string',
              description: 'App name',
            },
            machine_id: {
              type: 'string',
              description: 'Machine ID',
            },
          },
          required: ['app', 'machine_id'],
        },
      },
      {
        name: 'fly_volumes',
        description: 'List volumes for an app',
        inputSchema: {
          type: 'object',
          properties: {
            app: {
              type: 'string',
              description: 'App name',
            },
          },
          required: ['app'],
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
      case 'fly_list_apps': {
        let cmd = 'apps list';
        if (args.org) cmd += ` --org ${args.org}`;
        const result = await execFly(cmd);
        return {
          content: [
            {
              type: 'text',
              text: result.success ? result.stdout : `Error: ${result.stderr}`,
            },
          ],
        };
      }

      case 'fly_app_status': {
        const result = await execFly(`status --app ${args.app}`);
        return {
          content: [
            {
              type: 'text',
              text: result.success ? result.stdout : `Error: ${result.stderr}`,
            },
          ],
        };
      }

      case 'fly_deploy': {
        let cmd = 'deploy';
        if (args.app) cmd += ` --app ${args.app}`;
        if (args.remote_only !== false) cmd += ' --remote-only';
        if (args.strategy) cmd += ` --strategy ${args.strategy}`;
        const result = await execFly(cmd);
        return {
          content: [
            {
              type: 'text',
              text: result.success ? result.stdout : `Error: ${result.stderr}`,
            },
          ],
        };
      }

      case 'fly_logs': {
        let cmd = `logs --app ${args.app}`;
        if (args.instance) cmd += ` --instance ${args.instance}`;
        if (args.follow) cmd += ' --follow';
        const result = await execFly(cmd);
        return {
          content: [
            {
              type: 'text',
              text: result.success ? result.stdout : `Error: ${result.stderr}`,
            },
          ],
        };
      }

      case 'fly_scale': {
        let cmd = `scale count ${args.count} --app ${args.app}`;
        if (args.region) cmd += ` --region ${args.region}`;
        const result = await execFly(cmd);
        return {
          content: [
            {
              type: 'text',
              text: result.success ? result.stdout : `Error: ${result.stderr}`,
            },
          ],
        };
      }

      case 'fly_regions': {
        let cmd = args.list_available ? 'platform regions' : `regions list`;
        if (args.app && !args.list_available) cmd += ` --app ${args.app}`;
        const result = await execFly(cmd);
        return {
          content: [
            {
              type: 'text',
              text: result.success ? result.stdout : `Error: ${result.stderr}`,
            },
          ],
        };
      }

      case 'fly_secrets': {
        let cmd = `secrets ${args.action} --app ${args.app}`;
        if (args.key && args.action !== 'list') cmd += ` ${args.key}`;
        if (args.value && args.action === 'set') cmd += `=${args.value}`;
        const result = await execFly(cmd);
        return {
          content: [
            {
              type: 'text',
              text: result.success ? result.stdout : `Error: ${result.stderr}`,
            },
          ],
        };
      }

      case 'fly_postgres_list': {
        let cmd = 'postgres list';
        if (args.org) cmd += ` --org ${args.org}`;
        const result = await execFly(cmd);
        return {
          content: [
            {
              type: 'text',
              text: result.success ? result.stdout : `Error: ${result.stderr}`,
            },
          ],
        };
      }

      case 'fly_postgres_connect': {
        const result = await execFly(`postgres connect --app ${args.app}`);
        return {
          content: [
            {
              type: 'text',
              text: result.success ? result.stdout : `Error: ${result.stderr}`,
            },
          ],
        };
      }

      case 'fly_machine_list': {
        const result = await execFly(`machine list --app ${args.app}`);
        return {
          content: [
            {
              type: 'text',
              text: result.success ? result.stdout : `Error: ${result.stderr}`,
            },
          ],
        };
      }

      case 'fly_machine_stop': {
        const result = await execFly(`machine stop ${args.machine_id} --app ${args.app}`);
        return {
          content: [
            {
              type: 'text',
              text: result.success ? result.stdout : `Error: ${result.stderr}`,
            },
          ],
        };
      }

      case 'fly_machine_start': {
        const result = await execFly(`machine start ${args.machine_id} --app ${args.app}`);
        return {
          content: [
            {
              type: 'text',
              text: result.success ? result.stdout : `Error: ${result.stderr}`,
            },
          ],
        };
      }

      case 'fly_volumes': {
        const result = await execFly(`volumes list --app ${args.app}`);
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
  console.error('Fly.io MCP server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
