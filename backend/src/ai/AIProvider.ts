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

export type CalendarChangeProposal = {
  title: string
  description: string
  reason: string
  date: string // YYYY-MM-DD
  startTime: string // HH:MM
  endTime: string // HH:MM
}

/**
 * AIモデルを差し替え可能にするための共通インターフェース。
 * 実装は backend/src/ai/ClaudeProvider.ts など。
 * プロンプト文言はこのファイルには書かず prompts/ 以下に分離する。
 */
export interface AIProvider {
  analyzeReflection(input: ReflectionInputForAI): Promise<DailyAnalysisResult>

  /**
   * 振り返りをもとに、翌日のカレンダーへの変更案を作成する（提案のみ、反映はしない）。
   * ユーザーが個別に承認した場合のみ、呼び出し側がGoogleカレンダーへ反映する。
   */
  proposeCalendarChanges(
    input: ReflectionInputForAI & { tomorrowDate: string },
  ): Promise<CalendarChangeProposal[]>
}
