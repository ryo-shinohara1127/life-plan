import Anthropic from '@anthropic-ai/sdk'
import type {
  AIProvider,
  CalendarChangeProposal,
  DailyAnalysisResult,
  ReflectionInputForAI,
} from './AIProvider.js'
import { buildCalendarChangeProposalPrompt } from './prompts/calendarChangeProposal.js'
import { buildDailySummaryPrompt } from './prompts/dailySummary.js'

export class ClaudeProvider implements AIProvider {
  private client: Anthropic

  constructor() {
    this.client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  }

  private async complete(prompt: string): Promise<string> {
    const message = await this.client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    })
    const textBlock = message.content.find((block) => block.type === 'text')
    if (!textBlock || textBlock.type !== 'text') {
      throw new Error('Claude returned no text content')
    }
    return textBlock.text
  }

  async analyzeReflection(input: ReflectionInputForAI): Promise<DailyAnalysisResult> {
    const text = await this.complete(buildDailySummaryPrompt(input))
    const parsed = JSON.parse(text) as DailyAnalysisResult
    return {
      summary: parsed.summary,
      issues: parsed.issues,
      hypothesis: parsed.hypothesis,
      improvements: (parsed.improvements ?? []).slice(0, 3),
      continueItems: parsed.continueItems,
    }
  }

  async proposeCalendarChanges(
    input: ReflectionInputForAI & { tomorrowDate: string },
  ): Promise<CalendarChangeProposal[]> {
    const text = await this.complete(buildCalendarChangeProposalPrompt(input))
    const parsed = JSON.parse(text) as CalendarChangeProposal[]
    return parsed.slice(0, 2)
  }
}
