export interface TodoItem {
  id: string;
  text: string;
  file: string;
  line: number;
  completed: boolean;
  priority: Priority;
  type: Type;
  created: Date;
  tags: string[];
  subtasks: SubTask[];
  category?: string;
  notes?: string;
  lastModified: Date;
}

export interface SubTask {
  id: string;
  text: string;
  completed: boolean;
  created: Date;
  lastModified: Date;
}

export interface TagGroup {
  tag: string;
  todos: TodoItem[];
}

export interface CategoryGroup {
  category: string;
  todos: TodoItem[];
}

export type Priority = "HIGH" | "MEDIUM" | "LOW";
export type Type = "TODO" | "FIXME" | "BUG" | "HACK" | "NOTE" | "OPTIMIZE";
export type SortOption = "priority" | "created" | "category" | "lastModified";

export interface KeywordMatch {
  type: Type;
  text: string;
  category?: string;
  tags?: string[];
  notes?: string;
}