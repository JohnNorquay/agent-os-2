/**
 * Claude API Client
 * Handles communication with Claude API for task delegation
 */

import Anthropic from '@anthropic-ai/sdk';

export class ClaudeAPIClient {
  constructor(apiKey) {
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY is required');
    }

    this.client = new Anthropic({
      apiKey: apiKey,
    });
  }

  /**
   * Send a task to Chat Claude and get the result
   * @param {Object} task - Task object with description, context, and type
   * @returns {Promise<Object>} - Result with content and metadata
   */
  async executeTask(task) {
    const { task_id, task_type, description, context, output_format = 'markdown' } = task;

    // Build system prompt based on task type
    const systemPrompt = this.buildSystemPrompt(task_type, output_format);

    // Build user prompt with context and description
    const userPrompt = this.buildUserPrompt(description, context, output_format);

    try {
      const response = await this.client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 8096,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: userPrompt
          }
        ]
      });

      // Extract text content from response
      const content = response.content
        .filter(block => block.type === 'text')
        .map(block => block.text)
        .join('\n\n');

      return {
        task_id,
        status: 'completed',
        content,
        metadata: {
          model: response.model,
          usage: response.usage,
          stop_reason: response.stop_reason,
          completed_at: new Date().toISOString()
        }
      };
    } catch (error) {
      return {
        task_id,
        status: 'failed',
        error: error.message,
        metadata: {
          failed_at: new Date().toISOString()
        }
      };
    }
  }

  /**
   * Build system prompt based on task type
   */
  buildSystemPrompt(task_type, output_format) {
    const basePrompt = `You are Claude, an AI assistant helping with software development tasks. You are being used as part of a parallel workflow system where you handle ${task_type} tasks while another AI (Claude Code) handles implementation tasks.`;

    const typeSpecificPrompts = {
      research: `

Your role: Research and analysis expert
- Conduct thorough research on the given topic
- Compare multiple approaches or solutions
- Provide clear recommendations with pros/cons
- Include relevant links, examples, and references
- Be comprehensive but concise`,

      documentation: `

Your role: Technical documentation writer
- Create clear, well-structured documentation
- Include code examples where relevant
- Use proper markdown formatting
- Cover all important aspects
- Make it easy to understand for developers`,

      design: `

Your role: System and architecture designer
- Design robust, scalable solutions
- Consider best practices and patterns
- Provide clear architectural diagrams (as text/mermaid)
- Explain design decisions
- Consider trade-offs and alternatives`,

      analysis: `

Your role: Code and system analyst
- Analyze the given code or system thoroughly
- Identify patterns, issues, and opportunities
- Provide actionable insights
- Be specific and detailed
- Focus on practical improvements`,

      planning: `

Your role: Project planner and strategist
- Break down complex work into manageable tasks
- Consider dependencies and priorities
- Provide realistic estimates
- Think about potential blockers
- Create clear action plans`
    };

    const formatInstruction = output_format === 'json'
      ? '\n\nIMPORTANT: Output your response as valid JSON.'
      : '\n\nIMPORTANT: Output your response in well-formatted Markdown.';

    return basePrompt + (typeSpecificPrompts[task_type] || '') + formatInstruction;
  }

  /**
   * Build user prompt with context and task description
   */
  buildUserPrompt(description, context, output_format) {
    let prompt = '';

    if (context) {
      prompt += '# Project Context\n\n';
      prompt += context;
      prompt += '\n\n---\n\n';
    }

    prompt += '# Task\n\n';
    prompt += description;

    if (output_format === 'json') {
      prompt += '\n\n# Output Format\n\nProvide your response as valid JSON.';
    }

    return prompt;
  }

  /**
   * Test API connection
   */
  async testConnection() {
    try {
      const response = await this.client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 100,
        messages: [
          {
            role: 'user',
            content: 'Hello! Please respond with "Connection successful".'
          }
        ]
      });

      return {
        success: true,
        response: response.content[0].text
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}
