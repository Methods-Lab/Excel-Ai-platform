// 🔲 Dev 3 implements — factory: detects OS, returns correct driver
import type { IExcelDriver } from './IExcelDriver';

export type DriverType = 'exceljs' | 'com' | 'jxa';

/**
 * Factory that detects the current OS and returns the appropriate IExcelDriver.
 * - Windows: ComDriver (if available) → fallback ExcelJSDriver
 * - macOS: JXADriver (if available) → fallback ExcelJSDriver
 * - Other: ExcelJSDriver (default, cross-platform)
 *
 * Dev 3 (Haseeb) fills the implementation.
 */
export function createExcelDriver(_preferredDriver?: DriverType): IExcelDriver {
	throw new Error(
		'ExcelSDK.createExcelDriver is not implemented. Dev 3 fills this.'
	);
}
