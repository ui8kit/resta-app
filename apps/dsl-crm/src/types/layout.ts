export type LayoutMode = 'full' | 'with-sidebar' | 'sidebar-left';

export type FooterLink = {
  label: string;
  href: string;
};

export type FooterSection = {
  title: string;
  links: FooterLink[];
};
