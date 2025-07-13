import { Type, Priority } from "../types";

export const TODO_ICONS: Record<Type, string> = {
  TODO: "tasklist",
  FIXME: "tools",
  BUG: "bug",
  HACK: "zap",
  NOTE: "note",
  OPTIMIZE: "rocket",
};

export const PRIORITY_ICONS: Record<Priority, string> = {
  HIGH: "●",
  MEDIUM: "●",
  LOW: "●",
};

export const TODO_KEYWORDS: Record<string, Type> = {
  "TODO:": "TODO",
  "FIXME:": "FIXME",
  "BUG:": "BUG",
  "HACK:": "HACK",
  "NOTE:": "NOTE",
  "OPTIMIZE:": "OPTIMIZE",
};

export const PRIORITY_ORDER: Record<Priority, number> = {
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
};

export const PRIORITY_COLORS: Record<Priority, string> = {
  HIGH: "🔴",
  MEDIUM: "🟡",
  LOW: "🟢",
};