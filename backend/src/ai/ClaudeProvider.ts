import Anthropic from '@anthropic-ai/sdk'
import type { AIProvider, DailyAnalysisResult, ReflectionInputForAI } from './AIProvider.js'
import { buildDailySummaryPrompt } from './prompts/dailySummary.js'

export class ClaudeProvider implements AIProvider {
  private client: Anthropic

  constructor() {
    this.client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  }

  async analyzeReflection(input: ReflectionInputForAI): Promise<DailyAnalysisResult> {
    const prompt = buildDailySummaryPrompt(input)

    const message = await this.client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    })

    const textBlock = message.content.find((block) => block.type === 'text')
    if (!textBlock || textBlock.type !== 'text') {
      throw new Error('Claude returned no text content')
    }

    const parsed = JSON.parse(textBlock.text) as DailyAnalysisResult
    return {
      summary: parsed.summary,
      issues: parsed.issues,
      hypothesis: parsed.hypothesis,
      improvements: (parsed.improvements ?? []).slice(0, 3),
      continueItems: parsed.continueItems,
    }
  }
}
