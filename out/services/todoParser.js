"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TodoParser = void 0;
const constants_1 = require("../constants");
const utils_1 = require("../utils");
class TodoParser {
    static getKeywordMatch(line) {
        try {
            for (const [keyword, type] of Object.entries(constants_1.TODO_KEYWORDS)) {
                const index = line.indexOf(keyword);
                if (index === -1)
                    continue;
                const beforeKeyword = line.substring(0, index).trim();
                let text = line.substring(index + keyword.length);
                const categoryMatch = beforeKeyword.match(/\[(.*?)\]/);
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
    static isValidTodoLine(line) {
        return this.getKeywordMatch(line) !== null;
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