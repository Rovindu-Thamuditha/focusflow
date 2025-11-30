export type TimeBlockStatus = 'rest' | 'partial' | 'focus';

export interface TimeBlockState {
  hour: number;
  status: TimeBlockStatus;
}
