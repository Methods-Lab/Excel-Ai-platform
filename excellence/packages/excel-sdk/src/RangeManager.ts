// 🔲 Dev 3 implements — Excel range utilities
export class RangeManager {
	static toColumnLetter(_col: number): string {
		throw new Error('RangeManager.toColumnLetter not implemented. Dev 3 fills this.');
	}

	static fromA1(_ref: string): { row: number; col: number } {
		throw new Error('RangeManager.fromA1 not implemented. Dev 3 fills this.');
	}

	static toA1(_row: number, _col: number): string {
		throw new Error('RangeManager.toA1 not implemented. Dev 3 fills this.');
	}
}
