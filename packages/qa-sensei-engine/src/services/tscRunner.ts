import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { CodeFile } from '../types/index.js';

const execAsync = promisify(exec);

export class TscRunner {
  /**
   * 一時ディレクトリを作成して tsc --noEmit を検証実行する
   */
  static async runCheck(files: CodeFile[]): Promise<string> {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'tsc-check-'));

    try {
      // 1. ファイル展開
      for (const file of files) {
        const fullPath = path.join(tmpDir, file.path);
        await fs.mkdir(path.dirname(fullPath), { recursive: true });
        await fs.writeFile(fullPath, file.content, 'utf-8');
      }

      // 2. 最小構成の tsconfig.json を配置
      const tsConfig = {
        compilerOptions: {
          target: "ES2022",
          module: "CommonJS",
          moduleResolution: "node",
          strict: true,
          noEmit: true,
          skipLibCheck: true
        },
        include: ["src/**/*"]
      };
      await fs.writeFile(path.join(tmpDir, 'tsconfig.json'), JSON.stringify(tsConfig, null, 2));

      // ★ 3. プロジェクト内の tsc バイナリの絶対パスを取得して直接実行する
      const localTscPath = path.resolve(process.cwd(), 'node_modules/.bin/tsc');
      // const { stdout, stderr } = await execAsync(`"${localTscPath}" --noEmit --pretty false`, { cwd: tmpDir });
      const { stdout, stderr } = await execAsync(`"${localTscPath}" --noEmit --target es2022 --moduleResolution nodenext --module nodenext`, { cwd: tmpDir });
      
      return stdout || stderr;
    } catch (error: any) {
      const output = error.stdout || error.stderr || error.message || '';
      return typeof output === 'string' ? output : String(output);
    } finally {
      // 一時ディレクトリのクリーンアップ
      await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
    }
  }
}
