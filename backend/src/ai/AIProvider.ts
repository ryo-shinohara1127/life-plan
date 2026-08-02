export type ReflectionInputForAI = {
  date: string
  achieved: string | null
  notAchieved: string | null
  reason: string | null
  learning: string | null
  improvementIdea: string | null
  mood: number | null
  focusLevel: number | null
  sleepHours: number | null
}

export type DailyAnalysisResult = {
  summary: string
  issues: string
  hypothesis: string
  improvements: string[] // 最大3件
  continueItems: string
}

/**
 * AIモデルを差し替え可能にするための共通インターフェース。
 * 実装は backend/src/ai/ClaudeProvider.ts など。
 * プロンプト文言はこのファイルには書かず prompts/ 以下に分離する。
 */
export interface AIProvider {
  analyzeReflection(input: ReflectionInputForAI): Promise<DailyAnalysisResult>
}
