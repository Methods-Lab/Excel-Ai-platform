// 🔲 Dev 3 implements — transaction log for undo/rollback
export interface TransactionEntry {
	id: string;
	timestamp: number;
	action: 'insert' | 'update' | 'delete';
	sheetName: string;
	range: string;
}

export class TransactionLog {
	private entries: TransactionEntry[] = [];

	append(_entry: Omit<TransactionEntry, 'id' | 'timestamp'>): void {
		throw new Error('TransactionLog.append not implemented. Dev 3 fills this.');
	}

	getEntries(): TransactionEntry[] {
		return [...this.entries];
	}

	clear(): void {
		this.entries = [];
	}
}
