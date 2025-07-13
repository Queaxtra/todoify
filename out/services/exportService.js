"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExportService = void 0;
const vscode = __importStar(require("vscode"));
const constants_1 = require("../constants");
class ExportService {
    static instance;
    constructor() { }
    static getInstance() {
        if (!ExportService.instance) {
            ExportService.instance = new ExportService();
        }
        return ExportService.instance;
    }
    async exportTodos(todos, format) {
        let content = "";
        switch (format) {
            case "JSON":
                content = this.exportToJSON(todos);
                break;
            case "Markdown":
                content = this.exportToMarkdown(todos);
                break;
            case "CSV":
                content = this.exportToCSV(todos);
                break;
            default:
                throw new Error(`Unsupported export format: ${format}`);
        }
        await this.saveToFile(content, format);
    }
    exportToJSON(todos) {
        const exportData = todos.map(todo => ({
            id: todo.id,
            text: todo.text,
            file: todo.file,
            line: todo.line,
            completed: todo.completed,
            priority: todo.priority,
            type: todo.type,
            created: todo.created.toISOString(),
            lastModified: todo.lastModified.toISOString(),
            tags: todo.tags,
            category: todo.category,
            notes: todo.notes,
            subtasks: todo.subtasks.map(st => ({
                id: st.id,
                text: st.text,
                completed: st.completed,
                created: st.created.toISOString(),
                lastModified: st.lastModified.toISOString()
            }))
        }));
        return JSON.stringify(exportData, null, 2);
    }
    exportToMarkdown(todos) {
        const sections = this.groupTodosByCategory(todos);
        let content = "# Todo Export\n\n";
        content += `Generated on: ${new Date().toLocaleString()}\n`;
        content += `Total todos: ${todos.length}\n\n`;
        Object.entries(sections).forEach(([category, categoryTodos]) => {
            content += `## ${category}\n\n`;
            categoryTodos.forEach(todo => {
                const status = todo.completed ? "✅" : "⬜";
                const priority = constants_1.PRIORITY_COLORS[todo.priority];
                const tags = todo.tags.length ? `🏷️ ${todo.tags.join(", ")}` : "";
                content += `### ${status} ${priority} ${todo.text}\n\n`;
                content += `**Type:** ${todo.type}\n`;
                content += `**Priority:** ${todo.priority}\n`;
                content += `**File:** ${todo.file}:${todo.line}\n`;
                content += `**Created:** ${todo.created.toLocaleDateString()}\n`;
                content += `**Last Modified:** ${todo.lastModified.toLocaleDateString()}\n`;
                if (tags) {
                    content += `**Tags:** ${tags}\n`;
                }
                if (todo.notes) {
                    content += `\n**Notes:**\n${todo.notes}\n`;
                }
                if (todo.subtasks.length > 0) {
                    content += `\n**Subtasks:**\n`;
                    todo.subtasks.forEach(st => {
                        const stStatus = st.completed ? "✅" : "⬜";
                        content += `- ${stStatus} ${st.text}\n`;
                    });
                }
                content += "\n---\n\n";
            });
        });
        return content;
    }
    exportToCSV(todos) {
        const headers = [
            "ID", "Text", "File", "Line", "Status", "Priority", "Type",
            "Created", "Last Modified", "Tags", "Category", "Notes",
            "Subtasks"
        ];
        const rows = todos.map(todo => [
            this.escapeCsvField(todo.id),
            this.escapeCsvField(todo.text),
            this.escapeCsvField(todo.file),
            todo.line.toString(),
            todo.completed ? "Completed" : "Pending",
            todo.priority,
            todo.type,
            todo.created.toISOString(),
            todo.lastModified.toISOString(),
            this.escapeCsvField(todo.tags.join("; ")),
            this.escapeCsvField(todo.category || ""),
            this.escapeCsvField(todo.notes || ""),
            this.escapeCsvField(todo.subtasks.map(st => `${st.completed ? "✅" : "⬜"} ${st.text}`).join("; "))
        ]);
        return [headers.join(","), ...rows.map(row => row.join(","))].join("\n");
    }
    escapeCsvField(field) {
        if (field.includes(",") || field.includes('"') || field.includes("\n")) {
            return `"${field.replace(/"/g, '""')}"`;
        }
        return field;
    }
    groupTodosByCategory(todos) {
        const groups = {};
        todos.forEach(todo => {
            const category = todo.category || "Uncategorized";
            if (!groups[category]) {
                groups[category] = [];
            }
            groups[category].push(todo);
        });
        return groups;
    }
    async saveToFile(content, format) {
        const uri = await vscode.window.showSaveDialog({
            filters: {
                [format]: [format.toLowerCase()],
            },
            saveLabel: "Export",
            defaultUri: vscode.Uri.file(`todos-export.${format.toLowerCase()}`),
        });
        if (uri) {
            try {
                await vscode.workspace.fs.writeFile(uri, Buffer.from(content, "utf-8"));
                vscode.window.showInformationMessage("Todos exported successfully!");
            }
            catch (error) {
                console.error("Error exporting todos:", error);
                vscode.window.showErrorMessage("Error exporting todos");
            }
        }
    }
    async getExportPreview(todos, format) {
        const sampleTodos = todos.slice(0, 3);
        switch (format) {
            case "JSON":
                return this.exportToJSON(sampleTodos);
            case "Markdown":
                return this.exportToMarkdown(sampleTodos);
            case "CSV":
                return this.exportToCSV(sampleTodos);
            default:
                return "";
        }
    }
    getExportStats(todos) {
        const categories = new Set(todos.map(t => t.category || "Uncategorized"));
        const tags = new Set(todos.flatMap(t => t.tags));
        const priorityBreakdown = { HIGH: 0, MEDIUM: 0, LOW: 0 };
        const typeBreakdown = {};
        todos.forEach(todo => {
            priorityBreakdown[todo.priority]++;
            typeBreakdown[todo.type] = (typeBreakdown[todo.type] || 0) + 1;
        });
        return {
            totalTodos: todos.length,
            completedTodos: todos.filter(t => t.completed).length,
            pendingTodos: todos.filter(t => !t.completed).length,
            categoriesCount: categories.size,
            tagsCount: tags.size,
            priorityBreakdown,
            typeBreakdown
        };
    }
}
exports.ExportService = ExportService;
//# sourceMappingURL=exportService.js.map