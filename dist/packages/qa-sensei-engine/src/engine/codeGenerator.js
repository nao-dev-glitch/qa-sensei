import { TscRunner } from '../services/tscRunner.js';
import { TscLogParser } from '../services/parser.js';
export class SelfHealingEngine {
    maxRetries = 3;
    /**
     * LLM呼び出し関数（外部から注入、またはGemini API等を直接呼び出し）
     */
    aiCaller;
    constructor(aiCaller) {
        this.aiCaller = aiCaller;
    }
    /**
     * 自動修復ループのメインエントリーポイント
     */
    async execute(initialPrompt) {
        let currentFiles = await this.aiCaller(initialPrompt);
        const history = [];
        for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
            console.log(`\n🔄 [Loop ${attempt}/${this.maxRetries}] AIによるコード生成・修復中...`);
            const rawLog = await TscRunner.runCheck(currentFiles);
            console.log(`\n--- [Debug: Attempt ${attempt} tsc raw log] ---`);
            console.log(rawLog || '(ログ出力なし / エラー0件)');
            console.log('-------------------------------------------\n');
            const analysis = TscLogParser.parse(rawLog);
            // ✅ エラーなし：成功
            if (analysis.totalErrors === 0) {
                console.log(`✅ [Loop ${attempt}/${this.maxRetries}] 型チェック通過！`);
                return { success: true, files: currentFiles };
            }
            else {
                console.log(`❌ [Loop ${attempt}/${this.maxRetries}] 型エラー検出（${analysis.totalErrors}件）。AIに修復を依頼します...`);
            }
            // ★ デバッグログを追加：tsc の生の出力を確認する
            // 履歴記録
            history.push({
                attempt,
                strategySummary: `Attempt ${attempt}: ${analysis.totalErrors} errors detected in ${analysis.affectedFiles.join(', ')}`,
                errorCount: analysis.totalErrors,
            });
            // ❌ リトライ上限達成：エスカレーション報告を作成
            if (attempt === this.maxRetries) {
                const escalationReport = {
                    status: 'ESCALATION_REQUIRED',
                    attempts: this.maxRetries,
                    summary: {
                        reason: `自動修復上限（${this.maxRetries}回）に達しましたが、${analysis.totalErrors}件の型エラーが残存しています。`,
                        recommendedAction: `エラーが発生している型定義（例: ${analysis.affectedFiles[0]}）の手動確認・修正を推奨します。`,
                    },
                    remainingErrors: Object.values(analysis.errorsByFile).flat(),
                    history,
                    latestCode: currentFiles,
                };
                return { success: false, escalation: escalationReport };
            }
            // 🔄 修復プロンプト構築 ＆ 再実行
            const targetFiles = TscLogParser.extractRelevantFiles(currentFiles, analysis);
            const repairPrompt = this.buildRepairPrompt(analysis.summaryText, targetFiles, history);
            currentFiles = await this.aiCaller(repairPrompt);
        }
        return { success: false };
    }
    buildRepairPrompt(errorSummary, targetFiles, history) {
        const codeBlock = targetFiles.map((f) => `#### \`${f.path}\`\n\`\`\`typescript\n${f.content}\n\`\`\``).join('\n\n');
        const historyText = history.map((h) => `- Attempt ${h.attempt}: ${h.errorCount} errors`).join('\n');
        return `
# 【緊急修復指示】TypeScript型チェック（tsc）エラー修正

## 1. エラーログ
${errorSummary}

## 2. 過去の試行履歴
${historyText}

## 3. 対象コード
${codeBlock}

指示に従い、型エラーを解消した完全なコード（全ファイル）をマルチファイル構造で再出力してください。
`;
    }
}
