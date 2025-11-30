
export interface TimeBlockState {
  hour: number;
  subject: string;
  duration: number; // in minutes
  date: string; // ISO string
}

export interface Subject {
  id: string;
  name: string;
  icon: string;
  color: string;
}
