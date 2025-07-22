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
exports.TodoCommands = void 0;
const vscode = __importStar(require("vscode"));
const services_1 = require("../services");
const utils_1 = require("../utils");
class TodoCommands {
    static instance;
    provider;
    workspaceScanner;
    exportService;
    constructor(provider) {
        this.provider = provider;
        this.workspaceScanner = services_1.WorkspaceScanner.getInstance();
        this.exportService = services_1.ExportService.getInstance();
    }
    static getInstance(provider) {
        if (!TodoCommands.instance) {
            TodoCommands.instance = new TodoCommands(provider);
        }
        return TodoCommands.instance;
    }
    async refreshTodos() {
        try {
            vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: "Scanning workspace for todos...",
                cancellable: false
            }, async (progress) => {
                const existingTodos = this.provider.getAllTodos();
                const todos = await this.workspaceScanner.scanWorkspace(existingTodos);
                this.provider.clearTodos();
                todos.forEach(todo => this.provider.addTodo(todo));
                progress.report({ increment: 100, message: `Found ${todos.length} todos` });
                vscode.window.showInformationMessage(`Found ${todos.length} todos in workspace`);
            });
        }
        catch (error) {
            console.error("Error refreshing todos:", error);
            vscode.window.showErrorMessage("Error scanning workspace for todos");
        }
    }
    async searchTodos() {
        const searchText = await vscode.window.showInputBox({
            prompt: "Enter text to search",
            placeHolder: "Search for todo, tag or category...",
        });
        if (searchText !== undefined) {
            this.provider.setSearchFilter(searchText);
        }
    }
    clearSearch() {
        this.provider.setSearchFilter("");
    }
    async exportTodos() {
        const format = await vscode.window.showQuickPick(["JSON", "Markdown", "CSV"], { placeHolder: "Select export format" });
        if (!format)
            return;
        try {
            const todos = this.provider.getAllTodos();
            await this.exportService.exportTodos(todos, format);
        }
        catch (error) {
            console.error("Error exporting todos:", error);
            vscode.window.showErrorMessage("Error exporting todos");
        }
    }
    async deleteTodo(item) {
        if (!item)
            return;
        const result = await vscode.window.showWarningMessage(`"${item.text}" will be deleted. Are you sure?`, { modal: true }, "Delete", "Cancel");
        if (result === "Delete") {
            this.provider.deleteTodo(item);
            vscode.window.showInformationMessage("Todo deleted successfully");
        }
    }
    async duplicateTodo(item) {
        if (!item)
            return;
        try {
            const document = await vscode.workspace.openTextDocument(item.file);
            const edit = new vscode.WorkspaceEdit();
            const line = document.lineAt(item.line - 1);
            const lineText = line.text;
            const todoMatch = services_1.TodoParser.getKeywordMatch(lineText, item.file);
            if (!todoMatch) {
                throw new Error("Invalid todo format");
            }
            edit.insert(document.uri, new vscode.Position(item.line, 0), "\n" + lineText);
            const success = await vscode.workspace.applyEdit(edit);
            if (success) {
                await document.save();
                await this.refreshTodos();
                vscode.window.showInformationMessage("Todo duplicated successfully");
            }
            else {
                throw new Error("Failed to apply edit");
            }
        }
        catch (error) {
            console.error("Error duplicating todo:", error);
            const errorMessage = error instanceof Error ? error.message : "Unknown error";
            vscode.window.showErrorMessage(`Error duplicating todo: ${errorMessage}`);
        }
    }
    async toggleTodo(item) {
        if (!item)
            return;
        await this.provider.toggleTodo(item);
    }
    async openTodo(item) {
        if (!item) {
            vscode.window.showErrorMessage("Please select a todo");
            return;
        }
        try {
            const document = await vscode.workspace.openTextDocument(item.file);
            const editor = await vscode.window.showTextDocument(document);
            const pos = new vscode.Position(item.line - 1, 0);
            editor.revealRange(new vscode.Range(pos, pos), vscode.TextEditorRevealType.InCenter);
            editor.selection = new vscode.Selection(pos, pos);
        }
        catch (error) {
            vscode.window.showErrorMessage(`Failed to open file: ${item.file}`);
        }
    }
    async addSubtask(item) {
        if (!item)
            return;
        const subtaskText = await vscode.window.showInputBox({
            prompt: "Enter subtask text:",
            placeHolder: "Subtask description...",
        });
        if (!subtaskText?.trim())
            return;
        const subtask = {
            id: (0, utils_1.generateId)(),
            text: subtaskText.trim(),
            completed: false,
            created: new Date(),
            lastModified: new Date(),
        };
        item.subtasks.push(subtask);
        this.provider.updateTodo(item);
        vscode.window.showInformationMessage("Subtask added successfully");
    }
    async editTags(item) {
        if (!item)
            return;
        const tags = await vscode.window.showInputBox({
            prompt: "Enter tags (comma separated):",
            value: item.tags.join(", "),
            placeHolder: "tag1, tag2, tag3...",
        });
        if (tags !== undefined) {
            item.tags = tags
                .split(",")
                .map((t) => t.trim())
                .filter((t) => t);
            this.provider.updateTodo(item);
            vscode.window.showInformationMessage("Tags updated successfully");
        }
    }
    async editNotes(item) {
        if (!item)
            return;
        const notes = await vscode.window.showInputBox({
            prompt: "Enter notes:",
            value: item.notes || "",
            placeHolder: "Additional notes about this todo...",
        });
        if (notes !== undefined) {
            item.notes = notes;
            this.provider.updateTodo(item);
            vscode.window.showInformationMessage("Notes updated successfully");
        }
    }
    async changePriority(item) {
        if (!item)
            return;
        const priority = await vscode.window.showQuickPick([
            { label: "🔴 HIGH", value: "HIGH" },
            { label: "🟡 MEDIUM", value: "MEDIUM" },
            { label: "🟢 LOW", value: "LOW" },
        ], {
            placeHolder: "Select priority",
            matchOnDescription: true,
        });
        if (priority) {
            item.priority = priority.value;
            this.provider.updateTodo(item);
            vscode.window.showInformationMessage(`Priority changed to ${priority.label}`);
        }
    }
    async changeSortOption() {
        const option = await vscode.window.showQuickPick([
            { label: "⚡ Priority", value: "priority" },
            { label: "📅 Created Date", value: "created" },
            { label: "📁 Category", value: "category" },
            { label: "🔄 Last Modified", value: "lastModified" },
        ], {
            placeHolder: "Select sort option",
            matchOnDescription: true,
        });
        if (option) {
            this.provider.setSortOption(option.value);
            vscode.window.showInformationMessage(`Sorted by ${option.label}`);
        }
    }
    async editText(item) {
        if (!item)
            return;
        await this.provider.startInlineEdit(item, "text");
    }
    async editNotesInline(item) {
        if (!item)
            return;
        await this.provider.startInlineEdit(item, "notes");
    }
    async editTagsInline(item) {
        if (!item)
            return;
        await this.provider.startInlineEdit(item, "tags");
    }
    async focusView() {
        await vscode.commands.executeCommand("workbench.view.extension.todoify");
    }
    async showStats() {
        const todos = this.provider.getAllTodos();
        const stats = this.exportService.getExportStats(todos);
        const message = [
            `📊 Todo Statistics`,
            ``,
            `Total todos: ${stats.totalTodos}`,
            `✅ Completed: ${stats.completedTodos}`,
            `⏳ Pending: ${stats.pendingTodos}`,
            `📁 Categories: ${stats.categoriesCount}`,
            `🏷️ Tags: ${stats.tagsCount}`,
            ``,
            `Priority Breakdown:`,
            `🔴 High: ${stats.priorityBreakdown.HIGH}`,
            `🟡 Medium: ${stats.priorityBreakdown.MEDIUM}`,
            `🟢 Low: ${stats.priorityBreakdown.LOW}`,
        ].join('\n');
        vscode.window.showInformationMessage(message, { modal: true });
    }
    async createTodo() {
        const text = await vscode.window.showInputBox({
            prompt: "Enter todo text:",
            placeHolder: "What needs to be done?",
        });
        if (!text?.trim())
            return;
        const priority = await vscode.window.showQuickPick(["HIGH", "MEDIUM", "LOW"], { placeHolder: "Select priority" });
        if (!priority)
            return;
        const type = await vscode.window.showQuickPick(["TODO", "FIXME", "BUG", "HACK", "NOTE", "OPTIMIZE"], { placeHolder: "Select type" });
        if (!type)
            return;
        const activeEditor = vscode.window.activeTextEditor;
        if (!activeEditor) {
            vscode.window.showErrorMessage("No active editor to add todo");
            return;
        }
        const todo = {
            id: (0, utils_1.generateId)(),
            text: text.trim(),
            file: activeEditor.document.uri.fsPath,
            line: activeEditor.selection.active.line + 1,
            completed: false,
            priority: priority,
            type: type,
            created: new Date(),
            lastModified: new Date(),
            tags: [],
            subtasks: [],
            notes: "",
        };
        this.provider.addTodo(todo);
        vscode.window.showInformationMessage("Todo created successfully");
    }
}
exports.TodoCommands = TodoCommands;
//# sourceMappingURL=todoCommands.js.map