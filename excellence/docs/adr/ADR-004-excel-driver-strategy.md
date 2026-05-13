# ADR-004: Excel Driver Strategy Pattern

## Status
Accepted

## Context
Excellence must manipulate Excel workbooks across Windows and macOS. Different platforms offer different APIs with varying capabilities (COM automation on Windows, JXA on macOS, ExcelJS everywhere).

## Decision
Define `IExcelDriver` interface and implement three drivers behind a factory:
1. **ExcelJSDriver** (default, cross-platform) — Open XML manipulation via ExcelJS
2. **ComDriver** (Windows) — COM automation for advanced features
3. **JXADriver** (macOS) — JXA/AppleScript automation

### Rationale
- **Strategy pattern**: Clean abstraction, testable, extensible
- **ExcelJS first**: Works everywhere, no native dependencies
- **COM for Windows power users**: Live Excel integration, chart support
- **Safety**: Always work on temp copies, auto-backup originals, encrypt temp files

## Consequences
- `IExcelDriver` is the single contract — all consumers program against it
- COM references never escape to renderer process — worker threads only
- COM objects always released in `finally` blocks
- `proper-lockfile` prevents double-opening the same workbook
- Temp files encrypted with AES-256-GCM and deleted in `finally` blocks
