# Frontend Migration Notes

## What Moved Where

- Reference renderer app moved into `excellence/apps/renderer`.
- Reference shared IPC/table types moved into `excellence/packages/shared-types/src`.
- Renderer components were aligned to the production folders:
  - `components/chat`: chat view, input bar, message list/card, quick actions, table preview card.
  - `components/preview`: preview panel, editable table grid, confidence badge, flagged-cell editor, commit bar.
  - `components/shell`: main window, sidebar, pinned taskbar actions.
  - `components/workbook`: workbook tree, sheet tabs, workbook status.
  - `components/shared`: modal/dialog/toast/progress/loading/empty states.
  - `components/scraper`: URL input, table selector, relay instructions.
- Dev-only mock fixture lives at `excellence/apps/renderer/mocks/sampleData.ts`.

## Refactors

- Removed stale reference comments and mojibake dividers.
- Split larger reference components into production placeholders.
- Replaced hardcoded workbook path with IPC-driven workbook open/load flow.
- Added `extract:from-document` IPC contract and UI.
- Added `chat:send` and `workbook:open-dialog` IPC contracts.
- Isolated mock IPC behind `VITE_ENABLE_MOCK_IPC=true` using dynamic import.
- Fixed nested button patterns in workbook and flagged-cell UI.
- Added pinned taskbar actions for workbook, document, image, URL, and text.

## Mock IPC Flag

Default is production-safe:

```bash
VITE_ENABLE_MOCK_IPC=false
```

Set it to `true` only when testing the renderer without Electron shell handlers:

```bash
VITE_ENABLE_MOCK_IPC=true
```

When the flag is `false`, actions call real Electron IPC and show actionable errors if shell handlers are not available.

## Commands

From `excellence/`:

```bash
npm install
npm run build
npm run dev -w @excel-ai-platform/renderer
```

For browser-only frontend testing with mock IPC:

```bash
$env:VITE_ENABLE_MOCK_IPC="true"
npm run dev -w @excel-ai-platform/renderer
```

Docker:

```bash
docker compose up --build
```

For Docker mock mode, set `VITE_ENABLE_MOCK_IPC=true` in your shell or in `excellence/.env`.

## Manual Verification Checklist

- Open `http://localhost:5173`.
- Set `VITE_ENABLE_MOCK_IPC=true` when Electron shell handlers are not ready.
- Confirm pinned taskbar opens and supports Workbook, Document, Image, URL, and Text actions.
- Confirm Add document appears in chat quick actions.
- Confirm extracted data opens preview, edits cells, accepts/ignores flagged cells, and commits in mock mode.
- Confirm production mode shows clear shell-handler errors instead of silently using mocks.
- Verify real Electron preload exposes `window.electronAPI.invoke` before testing production IPC mode.
- Verify real handlers exist for `chat:send`, `workbook:open-dialog`, `workbook:load`, `extract:from-document`, and `table:commit`.
