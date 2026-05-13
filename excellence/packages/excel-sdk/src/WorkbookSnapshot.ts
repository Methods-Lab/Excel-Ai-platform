// 🔲 Dev 3 implements — workbook snapshot for point-in-time recovery
export class WorkbookSnapshot {
	static async create(_workbookPath: string, _destDir: string): Promise<string> {
		throw new Error('WorkbookSnapshot.create not implemented. Dev 3 fills this.');
	}

	static async restore(_snapshotPath: string, _targetPath: string): Promise<void> {
		throw new Error('WorkbookSnapshot.restore not implemented. Dev 3 fills this.');
	}
}
