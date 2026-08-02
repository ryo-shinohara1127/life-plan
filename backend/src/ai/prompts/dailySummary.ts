import type { ReflectionInputForAI } from '../AIProvider.js'

/**
 * 振り返り分析用プロンプト。
 * データの最小化方針：振り返り本文と睡眠/気分/集中度のみを渡し、
 * 過去の全履歴や無関係な個人情報は送らない（docs/02_architecture.md 7.3参照）。
 */
export function buildDailySummaryPrompt(input: ReflectionInputForAI): string {
  return `あなたは優秀な人生コーチ兼習慣コーチです。以下はユーザーの今日の振り返りです。
この内容をもとに分析してください。

日付: ${input.date}
できたこと: ${input.achieved ?? '(未記入)'}
できなかったこと: ${input.notAchieved ?? '(未記入)'}
できなかった理由: ${input.reason ?? '(未記入)'}
今日の学び: ${input.learning ?? '(未記入)'}
自分で考えた改善案: ${input.improvementIdea ?? '(未記入)'}
気分(1-5): ${input.mood ?? '(未記入)'}
集中度(1-5): ${input.focusLevel ?? '(未記入)'}
睡眠時間: ${input.sleepHours ?? '(未記入)'}

以下のJSON形式で**のみ**回答してください。前後に説明文やコードブロックの記号は付けないでください。

{
  "summary": "今日一日の要約（2〜3文）",
  "issues": "検出された課題（1〜2文、なければ「特になし」）",
  "hypothesis": "課題の原因の仮説（1〜2文、なければ「特になし」）",
  "improvements": ["明日の改善案1", "改善案2", "改善案3"],
  "continueItems": "継続すべきこと（1〜2文）"
}

improvementsは必ず1件以上3件以下の配列にしてください。押し付けがましくならず、
具体的で今日から実行しやすい提案にしてください。`
}
