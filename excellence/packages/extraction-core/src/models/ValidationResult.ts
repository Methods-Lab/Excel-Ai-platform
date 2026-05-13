export type IssueSeverity = 'error' | 'warning' | 'info';
export type IssueType =
	| 'type_mismatch'
	| 'sum_discrepancy'
	| 'duplicate_detected'
	| 'missing_value'
	| 'ocr_low_confidence'
	| 'overwrite_risk'
	| 'cross_field_violation';

export interface ValidationIssue {
	type: IssueType;
	row?: number;
	col?: number;
	message: string;
	severity: IssueSeverity;
}

export interface SumReconciliationResult {
	columnName: string;
	sourceTotal: number;
	computedTotal: number;
	match: boolean;
	discrepancy: number;
}

export interface DuplicateDetectionResult {
	duplicateFound: boolean;
	existingSheetName?: string;
	similarityScore?: number;
}

export interface ValidationResult {
	jobId: string;
	passed: boolean;
	issues: ValidationIssue[];
	sumReconciliation?: SumReconciliationResult;
	duplicateDetection?: DuplicateDetectionResult;
}
