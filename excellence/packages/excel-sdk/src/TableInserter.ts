// 🔲 Dev 3 implements — table insertion logic
import type { TableModel } from '@excel-ai-platform/extraction-core';

export class TableInserter {
	insertTable(_model: TableModel, _sheetName: string, _startCell: string): void {
		throw new Error('TableInserter.insertTable not implemented. Dev 3 fills this.');
	}
}
