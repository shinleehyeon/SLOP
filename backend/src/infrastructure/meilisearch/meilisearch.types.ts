export type MeiliAccountDocument = {
  id: string;
  name: string;
  email: string;
  fieldNames: string[];
  description: string | null;
  shortSeriesCount: number;
  profileImageUrl: string | null;
  createdAt: number;
};

export type MeiliShortDocument = {
  id: string;
  seriesId: string;
  title: string;
  seriesTitle: string;
  tags: string[];
  videoUrl: string;
  creatorUserId: string;
  creatorName: string;
  createdAt: number;
};
