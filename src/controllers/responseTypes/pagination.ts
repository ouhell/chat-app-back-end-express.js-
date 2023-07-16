export type Paginated<T> = {
  data: T[];
  size: number;
  total_size: number;
  current_page: number;
  total_pages: number;
  isFirstPage: boolean;
  isLastPage: boolean;
};
