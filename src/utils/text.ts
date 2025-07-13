import { Priority } from "../types";

export function strikeThrough(text: string): string {
  return `~~${text}~~`;
}

export function detectPriority(text: string): Priority {
  const upperText = text.toUpperCase();
  if (
    upperText.includes("URGENT") ||
    upperText.includes("CRITICAL") ||
    upperText.includes("HIGH") ||
    upperText.includes("!!!")
  ) {
    return "HIGH";
  } else if (
    upperText.includes("MEDIUM") ||
    upperText.includes("NORMAL") ||
    upperText.includes("!!")
  ) {
    return "MEDIUM";
  } else {
    return "LOW";
  }
}

export function extractTags(text: string): string[] {
  return text.match(/#[\w-]+/g)?.map((tag) => tag.substring(1)) || [];
}

export function removeTags(text: string): string {
  return text.replace(/#[\w-]+/g, "").trim();
}

export function formatTodoText(text: string, completed: boolean): string {
  return completed ? strikeThrough(text) : text;
}