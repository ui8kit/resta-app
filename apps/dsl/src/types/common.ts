export type Price = {
  amount: number;
  currency: string;
  display: string;
};

export type Image = {
  src: string;
  alt?: string;
  width?: number;
  height?: number;
};

export type Category = {
  id: string;
  title: string;
};
