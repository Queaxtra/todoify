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
  "TODO": "TODO",
  "FIXME": "FIXME",
  "BUG": "BUG",
  "HACK": "HACK",
  "NOTE": "NOTE",
  "OPTIMIZE": "OPTIMIZE",
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
export const COMMENT_PATTERNS: Record<string, { singleLine?: RegExp; multiLine?: RegExp; }> = {
  ".js": {
    singleLine: /\/\/(.*)/,
    multiLine: /\/\*([\s\S]*?)\*\//,
  },
  ".ts": {
    singleLine: /\/\/(.*)/,
    multiLine: /\/\*([\s\S]*?)\*\//,
  },
  ".jsx": {
    singleLine: /\/\/(.*)/,
    multiLine: /\/\*([\s\S]*?)\*\//,
  },
  ".svelte": {
    singleLine: /\/\/(.*)/,
    multiLine: /\/\*([\s\S]*?)\*\//,
  },
  ".tsx": {
    singleLine: /\/\/(.*)/,
    multiLine: /\/\*([\s\S]*?)\*\//,
  },
  ".py": {
    singleLine: /#(.*)/,
    multiLine: /'''([\s\S]*?)'''|"""([\s\S]*?)"""/,
  },
  ".java": {
    singleLine: /\/\/(.*)/,
    multiLine: /\/\*([\s\S]*?)\*\//,
  },
  ".c": {
    singleLine: /\/\/(.*)/,
    multiLine: /\/\*([\s\S]*?)\*\//,
  },
  ".cpp": {
    singleLine: /\/\/(.*)/,
    multiLine: /\/\*([\s\S]*?)\*\//,
  },
  ".cs": {
    singleLine: /\/\/(.*)/,
    multiLine: /\/\*([\s\S]*?)\*\//,
  },
  ".php": {
    singleLine: /\/\/(.*)|#(.*)/,
    multiLine: /\/\*([\s\S]*?)\*\//,
  },
  ".rb": {
    singleLine: /#(.*)/,
    multiLine: /=begin([\s\S]*?)=end/,
  },
  ".go": {
    singleLine: /\/\/(.*)/,
    multiLine: /\/\*([\s\S]*?)\*\//,
  },
  ".rs": {
    singleLine: /\/\/(.*)/,
    multiLine: /\/\*([\s\S]*?)\*\//,
  },
  ".swift": {
    singleLine: /\/\/(.*)/,
    multiLine: /\/\*([\s\S]*?)\*\//,
  },
  ".kt": {
    singleLine: /\/\/(.*)/,
    multiLine: /\/\*([\s\S]*?)\*\//,
  },
  ".scala": {
    singleLine: /\/\/(.*)/,
    multiLine: /\/\*([\s\S]*?)\*\//,
  },
  ".html": {
    multiLine: /<!--([\s\S]*?)-->/,
  },
  ".vue": {
    singleLine: /\/\/(.*)/,
    multiLine: /\/\*([\s\S]*?)\*\//,
  },
  ".css": {
    multiLine: /\/\*([\s\S]*?)\*\//,
  },
  ".scss": {
    singleLine: /\/\/(.*)/,
    multiLine: /\/\*([\s\S]*?)\*\//,
  },
  ".sass": {
    singleLine: /\/\/(.*)/,
    multiLine: /\/\*([\s\S]*?)\*\//,
  },
  ".less": {
    singleLine: /\/\/(.*)/,
    multiLine: /\/\*([\s\S]*?)\*\//,
  },
  ".md": {},
  ".txt": {},
  ".yml": {
    singleLine: /#(.*)/,
  },
  ".yaml": {
    singleLine: /#(.*)/,
  },
  ".json": {},
  ".xml": {
    multiLine: /<!--([\s\S]*?)-->/,
  },
  ".sql": {
    singleLine: /--(.*)/,
    multiLine: /\/\*([\s\S]*?)\*\//,
  },
  ".sh": {
    singleLine: /#(.*)/,
  },
  ".ps1": {
    singleLine: /#(.*)/,
    multiLine: /<#([\s\S]*?)#>/,
  },
  ".dart": {
    singleLine: /\/\/(.*)/,
    multiLine: /\/\*([\s\S]*?)\*\//,
  },
  ".r": {
    singleLine: /#(.*)/,
  },
  ".m": {
    singleLine: /\/\/(.*)/,
    multiLine: /\/\*([\s\S]*?)\*\//,
  },
  ".pl": {
    singleLine: /#(.*)/,
    multiLine: /=pod([\s\S]*?)=cut/,
  },
  ".lua": {
    singleLine: /--(.*)/,
    multiLine: /--\[\[([\s\S]*?)\]\]/,
  },
  ".elm": {
    singleLine: /--(.*)/,
    multiLine: /\{\-([\s\S]*?)\-\}/,
  },
  ".ex": {
    singleLine: /#(.*)/,
  },
  ".exs": {
    singleLine: /#(.*)/,
  },
};