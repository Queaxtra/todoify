"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.COMMENT_PATTERNS = exports.PRIORITY_COLORS = exports.PRIORITY_ORDER = exports.TODO_KEYWORDS = exports.PRIORITY_ICONS = exports.TODO_ICONS = void 0;
exports.TODO_ICONS = {
    TODO: "tasklist",
    FIXME: "tools",
    BUG: "bug",
    HACK: "zap",
    NOTE: "note",
    OPTIMIZE: "rocket",
};
exports.PRIORITY_ICONS = {
    HIGH: "●",
    MEDIUM: "●",
    LOW: "●",
};
exports.TODO_KEYWORDS = {
    "TODO": "TODO",
    "FIXME": "FIXME",
    "BUG": "BUG",
    "HACK": "HACK",
    "NOTE": "NOTE",
    "OPTIMIZE": "OPTIMIZE",
};
exports.PRIORITY_ORDER = {
    HIGH: 1,
    MEDIUM: 2,
    LOW: 3,
};
exports.PRIORITY_COLORS = {
    HIGH: "🔴",
    MEDIUM: "🟡",
    LOW: "🟢",
};
exports.COMMENT_PATTERNS = {
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
//# sourceMappingURL=index.js.map