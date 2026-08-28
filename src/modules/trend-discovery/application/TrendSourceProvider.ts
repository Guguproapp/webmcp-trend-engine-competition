export interface TrendSourceProvider {
  searchKeywords(query: string): Promise<unknown[]>;
  getTrendingItems(): Promise<unknown[]>;
  getMomentum(itemId: string): Promise<{ score: number; growthRate: number }>;
}
