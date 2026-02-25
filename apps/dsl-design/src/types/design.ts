export type DesignSectionItem = {
  id: string;
  slug: string;
  title: string;
  description: string;
  badge?: string;
};

export type DesignSectionFixture = {
  title: string;
  subtitle: string;
  items: DesignSectionItem[];
};
