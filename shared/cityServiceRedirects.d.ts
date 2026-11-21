export interface CityServiceMerge {
  service: string;
  city: string;
  key: string;
  source: string;
  destination: string;
}

export const CITY_SERVICE_MERGES: CityServiceMerge[];
export function isMergedCityService(serviceSlug: string, citySlug: string): boolean;
