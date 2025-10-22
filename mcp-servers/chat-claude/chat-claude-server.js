#!/usr/bin/env node

/**
 * Chat Claude MCP Server
 * Enables parallel workflow by delegating research, documentation, and design tasks to Chat Claude
 * while Claude Code handles implementation tasks in the IDE
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { ClaudeAPIClient } from "./lib/claude-api-client.js";
import { TaskManager } from "./lib/task-manager.js";

// Get configuration from environment
const API_KEY = process.env.ANTHROPIC_API_KEY;
const PROJECT_ROOT = process.env.PROJECT_ROOT || process.cwd();

if (!API_KEY) {
  console.error("ERROR: ANTHROPIC_API_KEY environment variable is required");
  process.exit(1);
}

// Initialize clients
const claudeClient = new ClaudeAPIClient(API_KEY);
const taskManager = new TaskManager(PROJECT_ROOT);

// Initialize task manager
await taskManager.initialize();

// Create MCP server
const server = new Server(
  {
    name: "chat-claude",
    version: "0.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Tool implementations

async function delegateTask(args) {
  const { task_id, task_type, description, context, output_format = 'markdown' } = args;

  if (!task_id || !task_type || !description) {
    return {
      content: [{
        type: "text",
        text: "❌ Error: task_id, task_type, and description are required"
      }],
      isError: true
    };
  }

  try {
    // Add task to manager
    const task = taskManager.addTask({
      task_id,
      task_type,
      description,
      context,
      output_format
    });

    // Update status to in_progress
    taskManager.updateTask(task_id, { status: 'in_progress' });

    // Execute task via Claude API
    const result = await claudeClient.executeTask(task);

    // Update task with result
    taskManager.updateTask(task_id, {
      status: result.status,
      content: result.content,
      error: result.error,
      metadata: result.metadata
    });

    // Store result to file if successful
    if (result.status === 'completed') {
      const filepath = await taskManager.storeResultInSpec(task_id, result.content);

      return {
        content: [{
          type: "text",
          text: `✅ Task completed successfully!

**Task ID**: ${task_id}
**Type**: ${task_type}
**Status**: ${result.status}

**Result stored at**: ${filepath}

**Usage**:
- Input tokens: ${result.metadata.usage.input_tokens}
- Output tokens: ${result.metadata.usage.output_tokens}

**Preview** (first 500 chars):
${result.content.substring(0, 500)}${result.content.length > 500 ? '...' : ''}
`
        }]
      };
    } else {
      return {
        content: [{
          type: "text",
          text: `❌ Task failed: ${result.error}`
        }],
        isError: true
      };
    }
  } catch (error) {
    return {
      content: [{
        type: "text",
        text: `❌ Error delegating task: ${error.message}\n${error.stack}`
      }],
      isError: true
    };
  }
}

async function getTaskResult(args) {
  const { task_id } = args;

  if (!task_id) {
    return {
      content: [{
        type: "text",
        text: "❌ Error: task_id is required"
      }],
      isError: true
    };
  }

  try {
    const task = taskManager.getTask(task_id);

    if (!task) {
      return {
        content: [{
          type: "text",
          text: `❌ Task ${task_id} not found`
        }],
        isError: true
      };
    }

    let resultText = `# Task Result\n\n`;
    resultText += `**Task ID**: ${task_id}\n`;
    resultText += `**Type**: ${task.task_type}\n`;
    resultText += `**Description**: ${task.description}\n`;
    resultText += `**Status**: ${task.status}\n`;
    resultText += `**Created**: ${task.created_at}\n`;
    resultText += `**Updated**: ${task.updated_at}\n\n`;

    if (task.status === 'completed') {
      resultText += `**Result File**: ${task.result_filename || 'N/A'}\n\n`;

      // Include the actual content
      if (task.content) {
        resultText += `---\n\n${task.content}`;
      } else {
        // Try to read from file
        const fileContent = await taskManager.getResult(task_id);
        if (fileContent) {
          resultText += `---\n\n${fileContent}`;
        } else {
          resultText += `\n*No content available*`;
        }
      }
    } else if (task.status === 'failed') {
      resultText += `**Error**: ${task.error}\n`;
    } else {
      resultText += `\n*Task is ${task.status}*`;
    }

    return {
      content: [{
        type: "text",
        text: resultText
      }]
    };
  } catch (error) {
    return {
      content: [{
        type: "text",
        text: `❌ Error getting task result: ${error.message}`
      }],
      isError: true
    };
  }
}

async function listTasks(args) {
  const { status = 'all' } = args;

  try {
    const statusFilter = status === 'all' ? null : status;
    const tasks = taskManager.getAllTasks(statusFilter);
    const stats = taskManager.getStats();

    let text = `# Delegated Tasks\n\n`;
    text += `**Statistics**:\n`;
    text += `- Total: ${stats.total}\n`;
    text += `- Pending: ${stats.pending}\n`;
    text += `- In Progress: ${stats.in_progress}\n`;
    text += `- Completed: ${stats.completed}\n`;
    text += `- Failed: ${stats.failed}\n\n`;

    if (tasks.length === 0) {
      text += `No tasks found${status !== 'all' ? ` with status: ${status}` : ''}.\n`;
    } else {
      text += `## Tasks${status !== 'all' ? ` (${status})` : ''}\n\n`;

      tasks.forEach(task => {
        const statusIcon = {
          pending: '⏳',
          in_progress: '🔄',
          completed: '✅',
          failed: '❌'
        }[task.status] || '❓';

        text += `${statusIcon} **${task.task_id}**\n`;
        text += `   Type: ${task.task_type}\n`;
        text += `   Description: ${task.description}\n`;
        text += `   Status: ${task.status}\n`;
        text += `   Created: ${task.created_at}\n`;

        if (task.result_filename) {
          text += `   Result: ${task.result_filename}\n`;
        }

        text += `\n`;
      });
    }

    return {
      content: [{
        type: "text",
        text
      }]
    };
  } catch (error) {
    return {
      content: [{
        type: "text",
        text: `❌ Error listing tasks: ${error.message}`
      }],
      isError: true
    };
  }
}

async function cancelTask(args) {
  const { task_id } = args;

  if (!task_id) {
    return {
      content: [{
        type: "text",
        text: "❌ Error: task_id is required"
      }],
      isError: true
    };
  }

  try {
    const task = taskManager.getTask(task_id);

    if (!task) {
      return {
        content: [{
          type: "text",
          text: `❌ Task ${task_id} not found`
      }],
        isError: true
      };
    }

    if (task.status === 'completed' || task.status === 'failed') {
      return {
        content: [{
          type: "text",
          text: `⚠️ Cannot cancel task ${task_id}: already ${task.status}`
        }]
      };
    }

    // Mark as cancelled
    taskManager.updateTask(task_id, {
      status: 'cancelled',
      cancelled_at: new Date().toISOString()
    });

    return {
      content: [{
        type: "text",
        text: `✅ Task ${task_id} has been cancelled`
      }]
    };
  } catch (error) {
    return {
      content: [{
        type: "text",
        text: `❌ Error cancelling task: ${error.message}`
      }],
      isError: true
    };
  }
}

async function testConnection(args) {
  try {
    const result = await claudeClient.testConnection();

    if (result.success) {
      return {
        content: [{
          type: "text",
          text: `✅ Connection successful!\n\nResponse: ${result.response}\n\nThe Chat Claude MCP server is properly configured and can communicate with the Claude API.`
        }]
      };
    } else {
      return {
        content: [{
          type: "text",
          text: `❌ Connection failed: ${result.error}`
        }],
        isError: true
      };
    }
  } catch (error) {
    return {
      content: [{
        type: "text",
        text: `❌ Error testing connection: ${error.message}`
      }],
      isError: true
    };
  }
}

// Register tool handlers

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "delegate_task",
        description: "Delegate a task to Chat Claude for parallel execution. Use this for research, documentation, design, analysis, or planning tasks while you handle implementation in the IDE.",
        inputSchema: {
          type: "object",
          properties: {
            task_id: {
              type: "string",
              description: "Unique identifier for the task (e.g., 'oauth-research-2025-01-15')"
            },
            task_type: {
              type: "string",
              enum: ["research", "documentation", "design", "analysis", "planning"],
              description: "Type of task to delegate"
            },
            description: {
              type: "string",
              description: "Detailed description of what needs to be done"
            },
            context: {
              type: "string",
              description: "Optional project context to help Chat Claude understand the task better"
            },
            output_format: {
              type: "string",
              enum: ["markdown", "json", "text"],
              description: "Desired output format",
              default: "markdown"
            }
          },
          required: ["task_id", "task_type", "description"]
        }
      },
      {
        name: "get_task_result",
        description: "Retrieve the result of a delegated task by its ID",
        inputSchema: {
          type: "object",
          properties: {
            task_id: {
              type: "string",
              description: "Task identifier"
            }
          },
          required: ["task_id"]
        }
      },
      {
        name: "list_tasks",
        description: "List all delegated tasks with optional status filter",
        inputSchema: {
          type: "object",
          properties: {
            status: {
              type: "string",
              enum: ["all", "pending", "in_progress", "completed", "failed"],
              description: "Filter tasks by status",
              default: "all"
            }
          }
        }
      },
      {
        name: "cancel_task",
        description: "Cancel a pending or in-progress task",
        inputSchema: {
          type: "object",
          properties: {
            task_id: {
              type: "string",
              description: "Task identifier"
            }
          },
          required: ["task_id"]
        }
      },
      {
        name: "test_connection",
        description: "Test connection to Claude API to verify the MCP server is configured correctly",
        inputSchema: {
          type: "object",
          properties: {}
        }
      }
    ]
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "delegate_task":
        return await delegateTask(args || {});
      case "get_task_result":
        return await getTaskResult(args || {});
      case "list_tasks":
        return await listTasks(args || {});
      case "cancel_task":
        return await cancelTask(args || {});
      case "test_connection":
        return await testConnection(args || {});
      default:
        return {
          content: [{
            type: "text",
            text: `❌ Unknown tool: ${name}`
          }],
          isError: true
        };
    }
  } catch (error) {
    return {
      content: [{
        type: "text",
        text: `❌ Error executing ${name}: ${error.message}\n${error.stack}`
      }],
      isError: true
    };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Chat Claude MCP server running on stdio");
  console.error(`Project root: ${PROJECT_ROOT}`);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
