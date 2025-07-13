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
exports.activate = activate;
const vscode = __importStar(require("vscode"));
const providers_1 = require("./providers");
const commands_1 = require("./commands");
const services_1 = require("./services");
function activate(context) {
    const todoProvider = new providers_1.TodoTreeProvider(context);
    const todoCommands = commands_1.TodoCommands.getInstance(todoProvider);
    const workspaceScanner = services_1.WorkspaceScanner.getInstance();
    const treeView = vscode.window.createTreeView("todoify", {
        treeDataProvider: todoProvider,
    });
    const commands = [
        ["todoify.focus", () => todoCommands.focusView()],
        ["todoify.refresh", () => todoCommands.refreshTodos()],
        ["todoify.search", () => todoCommands.searchTodos()],
        ["todoify.clearSearch", () => todoCommands.clearSearch()],
        ["todoify.exportTodos", () => todoCommands.exportTodos()],
        ["todoify.deleteTodo", (item) => todoCommands.deleteTodo(item)],
        ["todoify.duplicateTodo", (item) => todoCommands.duplicateTodo(item)],
        ["todoify.toggleTodo", (item) => todoCommands.toggleTodo(item)],
        ["todoify.openTodo", (item) => todoCommands.openTodo(item)],
        ["todoify.addSubtask", (item) => todoCommands.addSubtask(item)],
        ["todoify.addTags", (item) => todoCommands.editTags(item)],
        ["todoify.addNotes", (item) => todoCommands.editNotes(item)],
        ["todoify.changePriority", (item) => todoCommands.changePriority(item)],
        ["todoify.sortBy", () => todoCommands.changeSortOption()],
        ["todoify.editText", (item) => todoCommands.editText(item)],
        ["todoify.editNotes", (item) => todoCommands.editNotesInline(item)],
        ["todoify.editTags", (item) => todoCommands.editTagsInline(item)],
        ["todoify.showStats", () => todoCommands.showStats()],
        ["todoify.createTodo", () => todoCommands.createTodo()],
    ];
    context.subscriptions.push(...commands.map(([command, callback]) => vscode.commands.registerCommand(command, callback)));
    vscode.workspace.onDidSaveTextDocument(() => {
        todoCommands.refreshTodos();
    });
    todoCommands.refreshTodos();
}
//# sourceMappingURL=extension.js.map