import type { AIProvider } from './AIProvider.js'
import { ClaudeProvider } from './ClaudeProvider.js'
import { GeminiProvider } from './GeminiProvider.js'

/**
 * 環境変数 AI_PROVIDER で使うAIを切り替える（未指定時はGemini＝無料枠あり）。
 * 将来 OpenAIProvider 等を追加する場合はここに分岐を足すだけでよい。
 */
export function getAIProvider(): AIProvider {
  const provider = process.env.AI_PROVIDER ?? 'gemini'
  switch (provider) {
    case 'gemini':
      return new GeminiProvider()
    case 'claude':
      return new ClaudeProvider()
    default:
      throw new Error(`Unknown AI_PROVIDER: ${provider}`)
  }
}
