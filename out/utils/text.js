"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.strikeThrough = strikeThrough;
exports.detectPriority = detectPriority;
exports.extractTags = extractTags;
exports.removeTags = removeTags;
exports.formatTodoText = formatTodoText;
function strikeThrough(text) {
    return `~~${text}~~`;
}
function detectPriority(text) {
    const upperText = text.toUpperCase();
    if (upperText.includes("URGENT") ||
        upperText.includes("CRITICAL") ||
        upperText.includes("HIGH") ||
        upperText.includes("!!!")) {
        return "HIGH";
    }
    else if (upperText.includes("MEDIUM") ||
        upperText.includes("NORMAL") ||
        upperText.includes("!!")) {
        return "MEDIUM";
    }
    else {
        return "LOW";
    }
}
function extractTags(text) {
    return text.match(/#[\w-]+/g)?.map((tag) => tag.substring(1)) || [];
}
function removeTags(text) {
    return text.replace(/#[\w-]+/g, "").trim();
}
function formatTodoText(text, completed) {
    return completed ? strikeThrough(text) : text;
}
//# sourceMappingURL=text.js.map