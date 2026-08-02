import { GoogleGenerativeAI } from '@google/generative-ai'
import type { AIProvider, DailyAnalysisResult, ReflectionInputForAI } from './AIProvider.js'
import { buildDailySummaryPrompt } from './prompts/dailySummary.js'

export class GeminiProvider implements AIProvider {
  private client: GoogleGenerativeAI

  constructor() {
    this.client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? '')
  }

  async analyzeReflection(input: ReflectionInputForAI): Promise<DailyAnalysisResult> {
    const prompt = buildDailySummaryPrompt(input)

    const model = this.client.getGenerativeModel({
      model: 'gemini-flash-latest',
      generationConfig: { responseMimeType: 'application/json' },
    })

    const result = await model.generateContent(prompt)
    const text = result.response.text()

    const parsed = JSON.parse(text) as DailyAnalysisResult
    return {
      summary: parsed.summary,
      issues: parsed.issues,
      hypothesis: parsed.hypothesis,
      improvements: (parsed.improvements ?? []).slice(0, 3),
      continueItems: parsed.continueItems,
    }
  }
}
