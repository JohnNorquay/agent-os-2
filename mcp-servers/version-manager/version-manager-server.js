#!/usr/bin/env node

/**
 * Version Manager MCP Server
 * Automates semantic versioning, releases, and changelog generation
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { exec } from "child_process";
import { promisify } from "util";
import { readFile, writeFile } from "fs/promises";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const execAsync = promisify(exec);

// Get project root from environment or use current directory
const PROJECT_ROOT = process.env.PROJECT_ROOT || process.cwd();

// Create MCP server
const server = new Server(
  {
    name: "version-manager",
    version: "0.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Helper function to execute commands in project root
async function execInProject(command) {
  try {
    const { stdout, stderr } = await execAsync(command, { 
      cwd: PROJECT_ROOT,
      encoding: 'utf8'
    });
    return { success: true, stdout: stdout.trim(), stderr: stderr.trim() };
  } catch (error) {
    return { 
      success: false, 
      error: error.message,
      stdout: error.stdout?.trim() || '',
      stderr: error.stderr?.trim() || ''
    };
  }
}

// Helper to read JSON file
async function readJSON(path) {
  const content = await readFile(join(PROJECT_ROOT, path), 'utf8');
  return JSON.parse(content);
}

// Helper to write JSON file
async function writeJSON(path, data) {
  const content = JSON.stringify(data, null, 2);
  await writeFile(join(PROJECT_ROOT, path), content, 'utf8');
}

// Tool implementations

async function bumpVersion({ bump_type = 'auto', prerelease, first_release = false }) {
  const commands = {
    auto: 'npm run release',
    major: 'npm run release:major',
    minor: 'npm run release:minor',
    patch: 'npm run release:patch'
  };
  
  let cmd = commands[bump_type] || commands.auto;
  
  if (first_release) {
    cmd += ' -- --first-release';
  }
  
  if (prerelease) {
    cmd += ` -- --prerelease ${prerelease}`;
  }
  
  const result = await execInProject(cmd);
  
  if (!result.success) {
    return {
      content: [{
        type: "text",
        text: `❌ Failed to bump version:\n${result.error || result.stderr}`
      }],
      isError: true
    };
  }
  
  // Get new version
  const packageJson = await readJSON('package.json');
  const version = packageJson.version;
  
  return {
    content: [{
      type: "text",
      text: `✅ Version bumped to ${version}\n\n${result.stdout}`
    }]
  };
}

async function getVersion({ format = 'json' }) {
  try {
    const packageJson = await readJSON('package.json');
    
    // Try to get backend version (may not exist yet)
    let backendVersion = null;
    try {
      const pyproject = await readFile(join(PROJECT_ROOT, 'backend/pyproject.toml'), 'utf8');
      const versionMatch = pyproject.match(/version\s*=\s*"([^"]+)"/);
      backendVersion = versionMatch ? versionMatch[1] : null;
    } catch (e) {
      // Backend may not exist yet
    }
    
    // Get last git tag
    const tagResult = await execInProject('git describe --tags --abbrev=0 2>/dev/null || echo "none"');
    const lastTag = tagResult.stdout || 'none';
    
    const versionInfo = {
      root: packageJson.version,
      frontend: packageJson.version,
      backend: backendVersion,
      lastTag: lastTag
    };
    
    if (format === 'string') {
      return {
        content: [{
          type: "text",
          text: packageJson.version
        }]
      };
    }
    
    return {
      content: [{
        type: "text",
        text: JSON.stringify(versionInfo, null, 2)
      }]
    };
  } catch (error) {
    return {
      content: [{
        type: "text",
        text: `❌ Error getting version: ${error.message}`
      }],
      isError: true
    };
  }
}

async function validateCommits({ from = 'last_tag', to = 'HEAD' }) {
  try {
    // Get commits
    let fromRef = from;
    if (from === 'last_tag') {
      const tagResult = await execInProject('git describe --tags --abbrev=0 2>/dev/null || echo "HEAD~10"');
      fromRef = tagResult.stdout || 'HEAD~10';
    }
    
    const logResult = await execInProject(`git log ${fromRef}..${to} --pretty=format:"%H|%s"`);
    
    if (!logResult.success) {
      return {
        content: [{
          type: "text",
          text: `❌ Failed to get commits: ${logResult.error}`
        }],
        isError: true
      };
    }
    
    const commits = logResult.stdout.split('\n').filter(Boolean).map(line => {
      const [sha, message] = line.split('|');
      return { sha, message };
    });
    
    // Validate conventional commit format
    const conventionalRegex = /^(feat|fix|docs|style|refactor|perf|test|chore|ci|revert)(\(.+\))?!?: .+/;
    const invalid = commits.filter(c => !conventionalRegex.test(c.message));
    
    const result = {
      valid: invalid.length === 0,
      total_commits: commits.length,
      invalid_commits: invalid.length,
      invalid_details: invalid.map(c => ({
        sha: c.sha.substring(0, 7),
        message: c.message
      }))
    };
    
    let text = `📊 Commit Validation Results:\n\n`;
    text += `Total commits: ${result.total_commits}\n`;
    text += `Valid: ${result.total_commits - result.invalid_commits}\n`;
    text += `Invalid: ${result.invalid_commits}\n\n`;
    
    if (invalid.length > 0) {
      text += `❌ Invalid commits (not conventional format):\n`;
      result.invalid_details.forEach(c => {
        text += `  ${c.sha}: ${c.message}\n`;
      });
      text += `\nExpected format: type(scope): description\n`;
      text += `Types: feat, fix, docs, style, refactor, perf, test, chore, ci, revert\n`;
    } else {
      text += `✅ All commits follow conventional format!\n`;
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
        text: `❌ Error validating commits: ${error.message}`
      }],
      isError: true
    };
  }
}

async function pushRelease({ remote = 'origin', branch = 'main' }) {
  try {
    // Push commits
    const pushResult = await execInProject(`git push ${remote} ${branch}`);
    if (!pushResult.success) {
      return {
        content: [{
          type: "text",
          text: `❌ Failed to push commits: ${pushResult.stderr}`
        }],
        isError: true
      };
    }
    
    // Push tags
    const tagResult = await execInProject(`git push --tags ${remote}`);
    if (!tagResult.success) {
      return {
        content: [{
          type: "text",
          text: `❌ Failed to push tags: ${tagResult.stderr}`
        }],
        isError: true
      };
    }
    
    return {
      content: [{
        type: "text",
        text: `✅ Successfully pushed to ${remote}/${branch} with tags`
      }]
    };
  } catch (error) {
    return {
      content: [{
        type: "text",
        text: `❌ Error pushing release: ${error.message}`
      }],
      isError: true
    };
  }
}

async function syncVersions({ version }) {
  try {
    const updates = [];
    
    // Update root package.json
    try {
      const rootPkg = await readJSON('package.json');
      rootPkg.version = version;
      await writeJSON('package.json', rootPkg);
      updates.push('package.json');
    } catch (e) {
      // File might not exist
    }
    
    // Update frontend package.json
    try {
      const frontendPkg = await readJSON('frontend/package.json');
      frontendPkg.version = version;
      await writeJSON('frontend/package.json', frontendPkg);
      updates.push('frontend/package.json');
    } catch (e) {
      // File might not exist
    }
    
    // Update backend pyproject.toml
    try {
      const pyprojectPath = join(PROJECT_ROOT, 'backend/pyproject.toml');
      let content = await readFile(pyprojectPath, 'utf8');
      content = content.replace(/version\s*=\s*"[^"]+"/g, `version = "${version}"`);
      await writeFile(pyprojectPath, content, 'utf8');
      updates.push('backend/pyproject.toml');
    } catch (e) {
      // File might not exist
    }
    
    // Update backend __init__.py
    try {
      const initPath = join(PROJECT_ROOT, 'backend/api/__init__.py');
      let content = await readFile(initPath, 'utf8');
      content = content.replace(/__version__\s*=\s*"[^"]+"/g, `__version__ = "${version}"`);
      await writeFile(initPath, content, 'utf8');
      updates.push('backend/api/__init__.py');
    } catch (e) {
      // File might not exist
    }
    
    return {
      content: [{
        type: "text",
        text: `✅ Synced version ${version} to ${updates.length} files:\n${updates.map(f => `  - ${f}`).join('\n')}`
      }]
    };
  } catch (error) {
    return {
      content: [{
        type: "text",
        text: `❌ Error syncing versions: ${error.message}`
      }],
      isError: true
    };
  }
}

async function getChangelog({ version }) {
  try {
    const changelogPath = join(PROJECT_ROOT, 'CHANGELOG.md');
    const content = await readFile(changelogPath, 'utf8');
    
    if (version) {
      // Extract specific version
      const versionRegex = new RegExp(`## \\[${version}\\][\\s\\S]*?(?=## \\[|$)`, 'm');
      const match = content.match(versionRegex);
      
      if (match) {
        return {
          content: [{
            type: "text",
            text: match[0]
          }]
        };
      } else {
        return {
          content: [{
            type: "text",
            text: `❌ Version ${version} not found in CHANGELOG.md`
          }],
          isError: true
        };
      }
    } else {
      // Return entire changelog
      return {
        content: [{
          type: "text",
          text: content
        }]
      };
    }
  } catch (error) {
    return {
      content: [{
        type: "text",
        text: `❌ Error reading changelog: ${error.message}`
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
        name: "bump_version",
        description: "Bump semantic version using standard-version. Analyzes commits and updates version, CHANGELOG, and creates git tag.",
        inputSchema: {
          type: "object",
          properties: {
            bump_type: {
              type: "string",
              enum: ["auto", "major", "minor", "patch"],
              description: "Version bump type. 'auto' analyzes commits to determine bump type.",
              default: "auto"
            },
            prerelease: {
              type: "string",
              enum: ["alpha", "beta", "rc"],
              description: "Optional pre-release identifier (e.g., 0.1.0-alpha.0)"
            },
            first_release: {
              type: "boolean",
              description: "Set to true for the first release (skips changelog generation)",
              default: false
            }
          }
        }
      },
      {
        name: "get_version",
        description: "Get current version information from package.json and other config files",
        inputSchema: {
          type: "object",
          properties: {
            format: {
              type: "string",
              enum: ["json", "string"],
              description: "Return format",
              default: "json"
            }
          }
        }
      },
      {
        name: "validate_commits",
        description: "Validate that commits follow conventional commit format",
        inputSchema: {
          type: "object",
          properties: {
            from: {
              type: "string",
              description: "Start commit/tag (use 'last_tag' for last git tag)",
              default: "last_tag"
            },
            to: {
              type: "string",
              description: "End commit",
              default: "HEAD"
            }
          }
        }
      },
      {
        name: "push_release",
        description: "Push release commit and tags to remote repository",
        inputSchema: {
          type: "object",
          properties: {
            remote: {
              type: "string",
              description: "Git remote name",
              default: "origin"
            },
            branch: {
              type: "string",
              description: "Branch to push",
              default: "main"
            }
          }
        }
      },
      {
        name: "sync_versions",
        description: "Sync version across all package files (package.json, pyproject.toml, __init__.py)",
        inputSchema: {
          type: "object",
          properties: {
            version: {
              type: "string",
              description: "Version to sync to all files (e.g., 0.2.0)"
            }
          },
          required: ["version"]
        }
      },
      {
        name: "get_changelog",
        description: "Get contents of CHANGELOG.md, optionally for a specific version",
        inputSchema: {
          type: "object",
          properties: {
            version: {
              type: "string",
              description: "Optional version to get specific changelog entry (e.g., 0.2.0)"
            }
          }
        }
      }
    ]
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  try {
    switch (name) {
      case "bump_version":
        return await bumpVersion(args || {});
      case "get_version":
        return await getVersion(args || {});
      case "validate_commits":
        return await validateCommits(args || {});
      case "push_release":
        return await pushRelease(args || {});
      case "sync_versions":
        return await syncVersions(args || {});
      case "get_changelog":
        return await getChangelog(args || {});
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
  console.error("Version Manager MCP server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
