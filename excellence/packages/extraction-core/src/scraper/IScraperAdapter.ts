export interface ScrapedContent {
  url: string;
  html: string;
  text: string;
  extractedAt: number;
  metadata?: Record<string, string>;
}

export interface IScraperAdapter {
  scrape(url: string, hint?: string): Promise<ScrapedContent>;
}
