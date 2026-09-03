import type { RegionalSearchPreferencesRepository } from '../application/RegionalSearchPreferencesRepository';
import {
  DEFAULT_REGIONAL_SEARCH_FILTERS,
  INTELLIGENCE_TYPES,
  MARKET_REGIONS,
  REGION_DEFAULT_PLATFORMS,
  YOUTUBE_CONTENT_FILTERS,
  type RegionalSearchFilters,
} from '../domain/RegionalDiscovery';
import { VIDEO_PLATFORMS } from '../domain/VideoDiscovery';
import { JsonStore, type KeyValueStorage } from '../../../shared/infrastructure/storage';
import { containsSensitiveText } from '../../../shared/security/PublicUrlSafety';

export const REGIONAL_SEARCH_STORAGE_KEY = 'trend-engine.regional-video-search.v1';

export class LocalRegionalSearchPreferencesRepository implements RegionalSearchPreferencesRepository {
  private readonly store: JsonStore<RegionalSearchFilters>;
  constructor(storage: KeyValueStorage) {
    this.store = new JsonStore(storage, REGIONAL_SEARCH_STORAGE_KEY, DEFAULT_REGIONAL_SEARCH_FILTERS);
  }
  read() {
    const stored = this.store.read();
    const region = MARKET_REGIONS.includes(stored.region) ? stored.region : DEFAULT_REGIONAL_SEARCH_FILTERS.region;
    const platforms = Array.isArray(stored.platforms)
      ? stored.platforms.filter((platform) => VIDEO_PLATFORMS.includes(platform))
      : [...REGION_DEFAULT_PLATFORMS[region]];
    const keyword = typeof stored.keyword === 'string' && !containsSensitiveText(stored.keyword) ? stored.keyword : '';
    const safe = {
      keyword,
      region,
      intelligenceType: stored.intelligenceType === 'all' || INTELLIGENCE_TYPES.includes(stored.intelligenceType)
        ? stored.intelligenceType
        : 'all' as const,
      platforms: platforms.length ? platforms : [...REGION_DEFAULT_PLATFORMS[region]],
      timeRangeHours: [24, 72, 168].includes(stored.timeRangeHours) ? stored.timeRangeHours : 24,
      youtubeContentForm: YOUTUBE_CONTENT_FILTERS.includes(stored.youtubeContentForm) ? stored.youtubeContentForm : 'all' as const,
    } satisfies RegionalSearchFilters;
    if (stored.keyword !== keyword) this.store.write(safe);
    return safe;
  }
  save(filters: RegionalSearchFilters) { this.store.write({ ...filters, keyword: containsSensitiveText(filters.keyword) ? '' : filters.keyword }); }
}
