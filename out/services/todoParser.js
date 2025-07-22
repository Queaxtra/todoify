"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TodoParser = void 0;
const constants_1 = require("../constants");
const utils_1 = require("../utils");
class TodoParser {
    static getKeywordMatch(line, filePath) {
        try {
            const ext = filePath.toLowerCase().substring(filePath.lastIndexOf("."));
            const commentPatterns = constants_1.COMMENT_PATTERNS[ext] || {};
            let commentContent = null;
            if (commentPatterns.singleLine) {
                const match = line.match(commentPatterns.singleLine);
                if (match && match[1]) {
                    commentContent = match[1].trim();
                }
            }
            if (commentContent === null && commentPatterns.multiLine) {
                const match = line.match(commentPatterns.multiLine);
                if (match) {
                    commentContent = match.slice(1).find(g => g !== undefined && g !== null) || null;
                    if (commentContent)
                        commentContent = commentContent.trim();
                }
            }
            if (commentContent === null) {
                return null;
            }
            for (const [keyword, type] of Object.entries(constants_1.TODO_KEYWORDS)) {
                const index = commentContent.indexOf(keyword);
                if (index === -1)
                    continue;
                let text = commentContent.substring(index + keyword.length).trim();
                const beforeKeywordInComment = commentContent.substring(0, index).trim();
                const categoryMatch = beforeKeywordInComment.match(/\[(.*?)\]/);
                const category = categoryMatch ? categoryMatch[1].trim() : undefined;
                const parts = text.split("//").map((part) => part.trim());
                text = parts[0];
                const notes = parts[1] || undefined;
                const tags = (0, utils_1.extractTags)(text);
                text = (0, utils_1.removeTags)(text);
                return {
                    type,
                    text: text.trim(),
                    category,
                    tags,
                    notes,
                };
            }
        }
        catch (error) {
            console.error("Error parsing todo:", error);
        }
        return null;
    }
    static isValidTodoLine(line, filePath) {
        return this.getKeywordMatch(line, filePath) !== null;
    }
    static extractPriorityFromText(text) {
        const priorityMatch = text.match(/\[([HIGH|MEDIUM|LOW]+)\]/i);
        return priorityMatch ? priorityMatch[1].toUpperCase() : (0, utils_1.detectPriority)(text);
    }
    static sanitizeText(text) {
        return text.replace(/\[([HIGH|MEDIUM|LOW]+)\]/gi, "").trim();
    }
}
exports.TodoParser = TodoParser;
//# sourceMappingURL=todoParser.js.map