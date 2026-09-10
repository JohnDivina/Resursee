export interface PublicApi {
  id: string;
  name: string;
  link: string;
  description: string;
  auth: string;
  https: boolean;
  cors: string;
  category: string;
}

export type ViewMode = 'grid' | 'list';

export type AuthFilterType = 'all' | 'none' | 'apiKey' | 'OAuth';

export type CorsFilterType = 'all' | 'yes' | 'no' | 'unknown';

export type SortOption = 'name-asc' | 'name-desc' | 'category';
