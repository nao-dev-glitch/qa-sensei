import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import { CodeFile } from './types/index.js';
import { SelfHealingEngine } from './engine/codeGenerator.js';

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error('❌ エラー: .env ファイルに GEMINI_API_KEY が設定されていません。');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);
// JSON構造化出力を指示してコードファイルを返させるレスポンス設定
const model = genAI.getGenerativeModel({
  model: 'gemini-3.5-flash-lite',
  generationConfig: {
    responseMimeType: 'application/json',
  },
});

/**
 * 実際の Gemini API を呼び出し、レスポンスの JSON から CodeFile[] を復元する関数
 */
async function geminiAiCaller(prompt: string): Promise<CodeFile[]> {
  console.log('\n🤖 [Gemini API Call] コード生成・修正リクエストを送信中...');

  const systemInstruction = `
あなたは優秀な TypeScript エンジニアです。
ユーザーからの要求または型エラー修復指示に従い、TypeScript のコードを生成してください。

必ず以下の JSON 配列形式のみで出力してください（Markdownの装飾コードブロックや前後の挨拶文章は一切含めないでください）。

[
  {
    "path": "src/types/user.ts",
    "content": "export interface User { id: string; name: string; }"
  },
  {
    "path": "src/services/userService.ts",
    "content": "import { User } from '../types/user';\\nexport function getUser(id: string): User { return { id, name: 'Alice' }; }"
  }
]
`;

  try {
    const result = await model.generateContent([
      { text: systemInstruction },
      { text: prompt },
    ]);

    const responseText = result.response.text();
    const files: CodeFile[] = JSON.parse(responseText);
    return files;
  } catch (error) {
    console.error('💥 Gemini API 呼び出し、または JSON パースでエラーが発生しました:', error);
    throw error;
  }
}

// ---------------------------------------------------------
// メイン実行関数
// ---------------------------------------------------------
async function main() {
  console.log('🚀 Phase 2 自動修復エンジン (Self-Healing Engine) リアルAPI検証テスト開始\n');

  const engine = new SelfHealingEngine(geminiAiCaller);

  // Geminiに「あえて型エラーが起きやすいようなちょっと不完全な設計」を求めるお題
  const initialPrompt = `
ユーザー管理サービス（User, UserService）のTypeScriptコードを作成してください。
以下の要件を満たしてください：
- src/types/user.ts に User インターフェースを定義（id, name, role）
- src/services/userService.ts に getUserRole(user: User) 関数を作成
- UserService 内で、User インターフェースに存在しない 'age' や 'email' プロパティを参照するような処理、または型の不一致をわざと含めたテスト用コードを一度作ってください。
  `;

  const result = await engine.execute(initialPrompt);

  if (result.success) {
    console.log('\n✅ 【完全成功】Gemini が生成したコードが型チェック（tsc）を全件通過しました！');
    console.log('--- 最終生成されたファイル一覧 ---');
    result.files?.forEach((f) => {
      console.log(`\n📄 [${f.path}]`);
      console.log(f.content);
    });
  } else if (result.escalation) {
    console.log('\n⚠️ 【エスカレーション報告】自動修復上限に達しました。');
    console.log('理由:', result.escalation.summary.reason);
    console.log('推奨アクション:', result.escalation.summary.recommendedAction);
    console.log('残存エラー数:', result.escalation.remainingErrors.length);
  }
}

main().catch((err) => console.error('💥 実行エラー:', err));
