import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
// Phase 2 のエンジンと型定義を相対パスでインポート
import { SelfHealingEngine } from '../../packages/qa-sensei-engine/src/engine/codeGenerator.js';
import { CodeFile } from '../../packages/qa-sensei-engine/src/types/index.js';


dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  throw new Error('GEMINI_API_KEY が設定されていません。');
}

const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({
  model: 'gemini-3.5-flash-lite',
  generationConfig: {
    responseMimeType: 'application/json',
  },
});

/**
 * Gemini API を呼び出す関数（Phase 2 のエンジンに渡す Caller）
 */
async function geminiCaller(prompt: string): Promise<CodeFile[]> {
    const systemInstruction = `
あなたは厳格な QA エンジニア 兼 TypeScript 専門家です。
指示されたテスト対象に対し、境界値・異常系・コーナーケースを網羅した高品質なテストコードおよび型定義を生成してください。

【重要な制約事項】
- Jest や Vitest などの外部テストライブラリは使用せず、純粋な TypeScript（console.assert や if 文によるエラーハンドリング等）で検証ロジックを完結させてください。
- 生成されたコードは、追加の npm パッケージなしで tsc の型チェックが 0 エラーで通る状態にしてください。

出力は必ず以下の JSON 配列形式のみとしてください（Markdown装飾不可）。
[
  {
    "path": "src/types/target.ts",
    "content": "..."
  },
  {
    "path": "src/tests/target.test.ts",
    "content": "..."
  }
]
`;

  const result = await model.generateContent([
    { text: systemInstruction },
    { text: prompt },
  ]);

  return JSON.parse(result.response.text());
}

export class QaGeneratorService {
  private engine: SelfHealingEngine;

  constructor() {
    this.engine = new SelfHealingEngine(geminiCaller);
  }

  /**
   * ユーザーの要求仕様から「厳しいQA視点」を注入したプロンプトを作成し、
   * 型エラー0件のコード一式を生成する
   */
  public async generateQaTestSuite(userRequirement: string) {
    // QA-Sensei 本来の「厳しいQAの観点（境界値・限界値・異常系）」をプロンプトに組み込む
    const strictQaPrompt = `
【テスト対象の要求仕様】
${userRequirement}

【QA-Sensei の厳格テスト方針】
上記の仕様に対し、以下の QA 観点を網羅する TypeScript の型定義およびテストコード（または検証ロジック）を作成してください。
1. **正常系:** 基本的なユースケース
2. **境界値（Boundary Value）:** 許容範囲の最小値・最大値・その前後（+1, -1）の挙動
3. **異常系（Exception）:** null, undefined, 空文字, 型不一致, 権限不足などのエラーハンドリング
4. **極端な入力（Corner Case）:** 巨大データや想定外の組み合わせ

生成するファイル群は TypeScript の \`tsc\` 型チェック（--noEmit）をエラーなしで全件通過できる完成度の高いコードにしてください。
`;

    // Phase 2 の自律修復エンジンを起動
    return await this.engine.execute(strictQaPrompt);
  }
}

