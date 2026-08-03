import type { ReflectionInputForAI } from '../AIProvider.js'

/**
 * カレンダー変更案のプロンプト。
 * 既存の予定を直接書き換える指示はせず、あくまで「新しい予定案」として提示させる。
 * 実際の反映はユーザーが承認したときのみバックエンドが行う（AIはここに書き込まない）。
 */
export function buildCalendarChangeProposalPrompt(
  input: ReflectionInputForAI & { tomorrowDate: string },
): string {
  return `あなたは優秀な習慣コーチです。以下はユーザーの今日の振り返りです。
これをもとに、明日（${input.tomorrowDate}）のスケジュールに対する具体的な変更案を
最大2件、考えてください。

今日の振り返り:
できたこと: ${input.achieved ?? '(未記入)'}
できなかったこと: ${input.notAchieved ?? '(未記入)'}
できなかった理由: ${input.reason ?? '(未記入)'}
自分で考えた改善案: ${input.improvementIdea ?? '(未記入)'}

重要な制約:
- 提案はあくまで「案」です。あなたが直接カレンダーを変更することはありません。
- 大きすぎる変更（1日の予定を全部組み替える等）は避け、今日の反省から自然に導ける
  小さく具体的な1〜2件にしてください。
- 提案がなければ空配列で構いません。無理に件数を埋めないでください。

以下のJSON配列の形式で**のみ**回答してください。前後に説明文やコードブロックの記号は
付けないでください。

[
  {
    "title": "カレンダーに登録するイベント名",
    "description": "この変更案の説明（ユーザーが読んで分かる文章）",
    "reason": "なぜこの変更を提案するのか",
    "date": "${input.tomorrowDate}",
    "startTime": "HH:MM",
    "endTime": "HH:MM"
  }
]`
}
