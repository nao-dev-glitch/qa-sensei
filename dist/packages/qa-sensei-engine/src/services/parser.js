export class TscLogParser {
    /**
     * tsc --pretty false の出力を構造化データへ変換
     */
    static parse(rawLog) {
        const regex = /^(.*?)\((\d+),(\d+)\):\s+error\s+(TS\d+):\s+(.*)$/gm;
        const errorsByFile = {};
        const affectedFilesSet = new Set();
        let match;
        let totalCount = 0;
        while ((match = regex.exec(rawLog)) !== null) {
            const [, filePath, lineStr, colStr, code, message] = match;
            const line = parseInt(lineStr, 10);
            const column = parseInt(colStr, 10);
            const errorObj = { filePath, line, column, code, message: message.trim() };
            if (!errorsByFile[filePath]) {
                errorsByFile[filePath] = [];
            }
            errorsByFile[filePath].push(errorObj);
            affectedFilesSet.add(filePath);
            totalCount++;
        }
        const affectedFiles = Array.from(affectedFilesSet);
        const summaryText = affectedFiles
            .map((file) => {
            const errs = errorsByFile[file];
            const errList = errs.map((e) => `  - Line ${e.line}:${e.column} [${e.code}]: ${e.message}`).join('\n');
            return `#### File: \`${file}\` (${errs.length} errors)\n${errList}`;
        })
            .join('\n\n');
        return { totalErrors: totalCount, affectedFiles, errorsByFile, summaryText };
    }
    /**
     * エラーが発生したファイル ＋ 型定義ファイルのみにコンテキストを絞り込む
     */
    static extractRelevantFiles(allFiles, analysis) {
        const targetPaths = new Set(analysis.affectedFiles);
        allFiles.forEach((f) => {
            if (f.path.includes('/types/') || f.path.endsWith('.d.ts')) {
                targetPaths.add(f.path);
            }
        });
        return allFiles.filter((f) => targetPaths.has(f.path));
    }
}
