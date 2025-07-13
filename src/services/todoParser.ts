import { Type, KeywordMatch } from "../types";
import { TODO_KEYWORDS } from "../constants";
import { detectPriority, extractTags, removeTags } from "../utils";

export class TodoParser {
  static getKeywordMatch(line: string): KeywordMatch | null {
    try {
      for (const [keyword, type] of Object.entries(TODO_KEYWORDS)) {
        const index = line.indexOf(keyword);
        if (index === -1) continue;

        const beforeKeyword = line.substring(0, index).trim();
        let text = line.substring(index + keyword.length);

        const categoryMatch = beforeKeyword.match(/\[(.*?)\]/);
        const category = categoryMatch ? categoryMatch[1].trim() : undefined;

        const parts = text.split("//").map((part) => part.trim());
        text = parts[0];
        const notes = parts[1] || undefined;

        const tags = extractTags(text);
        text = removeTags(text);

        return {
          type,
          text: text.trim(),
          category,
          tags,
          notes,
        };
      }
    } catch (error) {
      console.error("Error parsing todo:", error);
    }
    return null;
  }

  static isValidTodoLine(line: string): boolean {
    return this.getKeywordMatch(line) !== null;
  }

  static extractPriorityFromText(text: string): string {
    const priorityMatch = text.match(/\[([HIGH|MEDIUM|LOW]+)\]/i);
    return priorityMatch ? priorityMatch[1].toUpperCase() : detectPriority(text);
  }

  static sanitizeText(text: string): string {
    return text.replace(/\[([HIGH|MEDIUM|LOW]+)\]/gi, "").trim();
  }
}