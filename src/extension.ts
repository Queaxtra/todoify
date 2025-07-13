import * as vscode from "vscode";
import { TodoTreeProvider } from "./providers";
import { TodoCommands } from "./commands";
import { WorkspaceScanner } from "./services";

export function activate(context: vscode.ExtensionContext) {
  const todoProvider = new TodoTreeProvider(context);
  const todoCommands = TodoCommands.getInstance(todoProvider);
  const workspaceScanner = WorkspaceScanner.getInstance();

  const treeView = vscode.window.createTreeView("todoify", {
    treeDataProvider: todoProvider,
  });

  const commands: [string, (...args: any[]) => any][] = [
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

  context.subscriptions.push(
    ...commands.map(([command, callback]) =>
      vscode.commands.registerCommand(command, callback),
    ),
  );

  vscode.workspace.onDidSaveTextDocument(() => {
    todoCommands.refreshTodos();
  });


  todoCommands.refreshTodos();
}