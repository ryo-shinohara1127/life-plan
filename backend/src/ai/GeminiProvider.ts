import { GoogleGenerativeAI } from '@google/generative-ai'
import type {
  AIProvider,
  CalendarChangeProposal,
  DailyAnalysisResult,
  ReflectionInputForAI,
} from './AIProvider.js'
import { buildCalendarChangeProposalPrompt } from './prompts/calendarChangeProposal.js'
import { buildDailySummaryPrompt } from './prompts/dailySummary.js'

const MODEL_NAME = 'gemini-flash-latest'

export class GeminiProvider implements AIProvider {
  private client: GoogleGenerativeAI

  constructor() {
    this.client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? '')
  }

  private async complete(prompt: string): Promise<string> {
    const model = this.client.getGenerativeModel({
      model: MODEL_NAME,
      generationConfig: { responseMimeType: 'application/json' },
    })
    const result = await model.generateContent(prompt)
    return result.response.text()
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
