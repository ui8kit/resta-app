import type { Image } from './common';

export type BlogPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  body?: string;
  image?: Image;
  date?: string;
  author?: string;
};
