export interface CodeFile {
  path: string;
  content: string;
}

export interface TscError {
  filePath: string;
  line: number;
  column: number;
  code: string;
  message: string;
}

export interface TscAnalysisResult {
  totalErrors: number;
  affectedFiles: string[];
  errorsByFile: Record<string, TscError[]>;
  summaryText: string;
}

export interface AttemptLog {
  attempt: number;
  strategySummary: string;
  errorCount: number;
}

export interface EscalationReport {
  status: 'ESCALATION_REQUIRED';
  attempts: number;
  summary: {
    reason: string;
    recommendedAction: string;
  };
  remainingErrors: TscError[];
  history: AttemptLog[];
  latestCode: CodeFile[];
}
