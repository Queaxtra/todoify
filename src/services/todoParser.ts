import { Type, KeywordMatch } from "../types";
import { TODO_KEYWORDS, COMMENT_PATTERNS } from "../constants";
import { detectPriority, extractTags, removeTags } from "../utils";

export class TodoParser {
  static getKeywordMatch(line: string, filePath: string): KeywordMatch | null {
    try {
      const ext = filePath.toLowerCase().substring(filePath.lastIndexOf("."));
      const commentPatterns = COMMENT_PATTERNS[ext] || {};

      let commentContent: string | null = null;

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
          if (commentContent) commentContent = commentContent.trim();
        }
      }

      if (commentContent === null) {
        return null;
      }

      for (const [keyword, type] of Object.entries(TODO_KEYWORDS)) {
        const index = commentContent.indexOf(keyword);
        if (index === -1) continue;

        let text = commentContent.substring(index + keyword.length).trim();
        const beforeKeywordInComment = commentContent.substring(0, index).trim();
        const categoryMatch = beforeKeywordInComment.match(/\[(.*?)\]/);
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

  static isValidTodoLine(line: string, filePath: string): boolean {
    return this.getKeywordMatch(line, filePath) !== null;
  }

  static extractPriorityFromText(text: string): string {
    const priorityMatch = text.match(/\[([HIGH|MEDIUM|LOW]+)\]/i);
    return priorityMatch ? priorityMatch[1].toUpperCase() : detectPriority(text);
  }

  static sanitizeText(text: string): string {
    return text.replace(/\[([HIGH|MEDIUM|LOW]+)\]/gi, "").trim();
  }
}