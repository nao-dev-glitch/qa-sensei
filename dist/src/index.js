"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const qaGeneratorService_js_1 = require("./services/qaGeneratorService.js");
/**
 * 生成されたファイル群を特定のディレクトリへ自動保存する関数
 */
function saveGeneratedFiles(files, outputBaseDir) {
    console.log(`\n💾 指定ディレクトリ [ ${outputBaseDir} ] への保存を開始します...`);
    files.forEach((file) => {
        // 保存先のフルパスを作成 (例: ./output/src/types/target.ts)
        const filePath = path.join(outputBaseDir, file.path);
        const dirPath = path.dirname(filePath);
        // 階層ディレクトリが存在しない場合は自動作成
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }
        // ファイルの書き出し
        fs.writeFileSync(filePath, file.content, 'utf-8');
        console.log(`  └─ 📄 保存完了: ${filePath}`);
    });
    console.log('✨ 全ファイルの保存が完了しました！\n');
}
async function runQaSensei() {
    console.log('==================================================');
    console.log('🤖 QA-Sensei 統合システム 起動');
    console.log('==================================================\n');
    console.log('📌 [Step 1/3] ユーザー要求の解析 ＆ 厳格QAプロンプトの作成...');
    const qaService = new qaGeneratorService_js_1.QaGeneratorService();
    // 保存先のディレクトリを指定（例: プロジェクト内の "generated_code" フォルダ）
    const OUTPUT_DIR = path.join(process.cwd(), 'generated_code');
    const userRequirement = `
ユーザーの「年齢（age: 0〜120の数値）」と「会員ステータス（status: 'free' | 'premium'）」を受け取り、
プレミアムコンテンツの閲覧権限（boolean）を判定する関数のテストを作成してください。
  `;
    console.log(`📝 [ユーザー要求]: ${userRequirement.trim()}\n`);
    console.log('⚙️ QA観点の注入 ＆ 型チェック自動修復エンジンを実行中...\n');
    console.log('📌 [Step 2/3] 自動修復エンジンの実行（AI生成 ⇄ 型チェック）');
    console.time('⏱️ 全体処理時間'); // 処理時間を計測するタイマー開始
    const result = await qaService.generateQaTestSuite(userRequirement);
    if (result.success && result.files) {
        console.log('\n🎉 【統合成功】型チェック(tsc)を通過したコードが生成されました！');
        // ★ ここでファイル保存処理を実行！
        console.log('\n📌 [Step 3/3] 生成コードのローカル保存');
        saveGeneratedFiles(result.files, OUTPUT_DIR);
    }
    else {
        console.log('\n⚠️ 修復上限に達したため、手動の確認が必要です。');
    }
}
runQaSensei().catch(console.error);
