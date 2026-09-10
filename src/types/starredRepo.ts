export interface StarredRepoOwner {
  login: string;
  avatarUrl: string;
  htmlUrl: string;
}

export interface StarredRepo {
  id: number;
  name: string;
  fullName: string;
  owner: StarredRepoOwner;
  htmlUrl: string;
  description: string;
  language: string;
  stargazersCount: number;
  forksCount: number;
  openIssuesCount: number;
  topics: string[];
  updatedAt: string;
  pushedAt: string;
}

export type RepoSortOption = 'stars' | 'name-asc' | 'updated';
