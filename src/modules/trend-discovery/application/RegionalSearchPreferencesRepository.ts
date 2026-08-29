import type { RegionalSearchFilters } from '../domain/RegionalDiscovery';

export interface RegionalSearchPreferencesRepository {
  read(): RegionalSearchFilters;
  save(filters: RegionalSearchFilters): void;
}
