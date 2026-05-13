import type { IScraperAdapter, ScrapedContent } from './IScraperAdapter';

export class WebScraper implements IScraperAdapter {
	async scrape(_url: string, _hint?: string): Promise<ScrapedContent> {
		throw new Error('WebScraper is not implemented yet.');
	}
}
