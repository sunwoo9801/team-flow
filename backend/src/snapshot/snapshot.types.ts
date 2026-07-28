export interface SnapshotCardData {
  id: string;
  title: string;
  description: string | null;
  position: number;
  dueDate: string | null;
  assigneeIds: string[];
  labelIds: string[];
}

export interface SnapshotColumnData {
  id: string;
  title: string;
  position: number;
  cards: SnapshotCardData[];
}

export interface SnapshotData {
  columns: SnapshotColumnData[];
}
