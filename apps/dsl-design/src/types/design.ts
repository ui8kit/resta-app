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

export type OverviewSectionItem = {
  id: string;
  title: string;
  description: string;
  href: string;
};

export type OverviewFixture = {
  title: string;
  intro: string;
  sections: OverviewSectionItem[];
};
