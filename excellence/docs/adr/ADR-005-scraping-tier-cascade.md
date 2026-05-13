# ADR-005: Scraping Tier Cascade

## Status
Accepted

## Context
Excellence extracts tables from web pages. Sites vary in complexity — some serve static HTML, others require JavaScript rendering, and some need authenticated browser sessions.

## Decision
Implement a 4-tier scraping cascade with automatic fallback:

1. **Tier 1: Cheerio** — Static HTML parsing, fastest, try first always
2. **Tier 2: Playwright** — JS-rendered pages, persistent browser context (no cold start per page), stealth mode
3. **Tier 3: Browser Relay** — WebSocket to user's browser extension for CAPTCHA/auth-protected pages
4. **Tier 4: Paste HTML** — Manual paste fallback, ultimate escape hatch

### Rationale
- **Progressive complexity**: Most sites work with Tier 1, reducing resource usage
- **Stealth for Tier 2**: `playwright-extra` + stealth plugin, realistic viewport/user-agent, human-like scrolling
- **Relay for auth**: User's own browser session handles login/CAPTCHA — no credential storage needed
- **Paste as escape hatch**: Always works, zero infrastructure dependency

## Consequences
- `IScraperAdapter` interface — all tiers implement `scrape(url, hint?)`
- `allowed-urls.yaml` categorizes known sites by required tier
- Playwright contexts/pages always closed when done — memory leak prevention
- Random delays between requests — respectful scraping
- Browser relay accepts localhost connections only with one-time session token
- Configurable CSS selectors per site — log failures for rule updates
