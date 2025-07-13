import * as vscode from "vscode";
import { TodoItem, SubTask, TagGroup, CategoryGroup, SortOption } from "../types";
import { TODO_ICONS, PRIORITY_ICONS, PRIORITY_ORDER } from "../constants";
import { generateId } from "../utils";

export class TodoTreeProvider
  implements
    vscode.TreeDataProvider<TodoItem | TagGroup | CategoryGroup | SubTask>
{
  private _onDidChangeTreeData: vscode.EventEmitter<
    TodoItem | TagGroup | CategoryGroup | SubTask | undefined | null | void
  > = new vscode.EventEmitter<
    TodoItem | TagGroup | CategoryGroup | SubTask | undefined | null | void
  >();
  readonly onDidChangeTreeData: vscode.Event<
    TodoItem | TagGroup | CategoryGroup | SubTask | undefined | null | void
  > = this._onDidChangeTreeData.event;

  private todos: TodoItem[] = [];
  private filterText: string = "";
  private sortOption: SortOption = "lastModified";
  private categories: CategoryGroup[] = [];
  private tags: TagGroup[] = [];
  private context: vscode.ExtensionContext;
  private todoIconPath: vscode.Uri;
  private editableFields: Map<string, string> = new Map();

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    this.todoIconPath = vscode.Uri.joinPath(
      context.extensionUri,
      "resources",
      "todo.svg",
    );
    this.loadTodos();
  }

  refresh(): void {
    this.updateCategories();
    this.updateTags();
    this._onDidChangeTreeData.fire();
  }

  private updateCategories(): void {
    const categoryMap = new Map<string, TodoItem[]>();
    this.todos.forEach((todo) => {
      const category = todo.category || "Uncategorized";
      if (!categoryMap.has(category)) {
        categoryMap.set(category, []);
      }
      categoryMap.get(category)!.push(todo);
    });
    this.categories = Array.from(categoryMap.entries()).map(
      ([category, todos]) => ({ category, todos }),
    );
  }

  getTreeItem(
    element: TodoItem | TagGroup | CategoryGroup | SubTask,
  ): vscode.TreeItem {
    if (this.isSubTask(element)) {
      return this.getSubTaskTreeItem(element);
    } else if (this.isTagGroup(element)) {
      return this.getTagGroupTreeItem(element);
    } else if (this.isCategoryGroup(element)) {
      return this.getCategoryGroupTreeItem(element);
    } else {
      return this.getTodoTreeItem(element);
    }
  }

  private isSubTask(element: any): element is SubTask {
    return (
      element &&
      typeof element === "object" &&
      "id" in element &&
      "text" in element &&
      "completed" in element &&
      !("file" in element)
    );
  }

  private isTagGroup(element: any): element is TagGroup {
    return (
      element &&
      typeof element === "object" &&
      "tag" in element &&
      "todos" in element
    );
  }

  private isCategoryGroup(element: any): element is CategoryGroup {
    return (
      element &&
      typeof element === "object" &&
      "category" in element &&
      "todos" in element
    );
  }

  private getSubTaskTreeItem(subtask: SubTask): vscode.TreeItem {
    const item = new vscode.TreeItem(
      subtask.text,
      vscode.TreeItemCollapsibleState.None,
    );
    item.iconPath = new vscode.ThemeIcon(
      subtask.completed ? "check" : "circle-outline",
    );
    item.description = subtask.completed ? "Completed" : "";
    item.contextValue = "subtask";
    return item;
  }

  private getTagGroupTreeItem(tagGroup: TagGroup): vscode.TreeItem {
    const item = new vscode.TreeItem(
      `#${tagGroup.tag} (${tagGroup.todos.length})`,
      vscode.TreeItemCollapsibleState.Expanded,
    );
    item.iconPath = new vscode.ThemeIcon("tag");
    item.contextValue = "tagGroup";
    return item;
  }

  private getCategoryGroupTreeItem(
    categoryGroup: CategoryGroup,
  ): vscode.TreeItem {
    const item = new vscode.TreeItem(
      `${categoryGroup.category} (${categoryGroup.todos.length})`,
      vscode.TreeItemCollapsibleState.Expanded,
    );
    item.iconPath = new vscode.ThemeIcon("folder");
    item.contextValue = "categoryGroup";
    return item;
  }

  private getTodoTreeItem(todo: TodoItem): vscode.TreeItem {
    const item = new vscode.TreeItem(
      todo.text,
      todo.subtasks.length > 0
        ? vscode.TreeItemCollapsibleState.Collapsed
        : vscode.TreeItemCollapsibleState.None,
    );
    item.iconPath = new vscode.ThemeIcon(TODO_ICONS[todo.type]);
    item.description = this.getTodoDescription(todo);
    item.contextValue = "todoItem";
    item.command = {
      command: "todoify.openTodo",
      title: "Open Todo",
      arguments: [todo],
    };
    return item;
  }

  private getTodoDescription(todo: TodoItem): string {
    const parts: string[] = [];

    if (todo.completed) {
      parts.push("✓");
    }

    parts.push(PRIORITY_ICONS[todo.priority]);

    if (todo.tags.length > 0) {
      parts.push(`🏷️  ${todo.tags.join(", ")}`);
    }

    if (todo.category) {
      parts.push(`📁 ${todo.category}`);
    }

    return parts.join(" ");
  }

  getChildren(
    element?: TodoItem | TagGroup | CategoryGroup,
  ): Thenable<any[]> {
    if (!element) {
      return Promise.resolve(
        this.getSortedTodos().filter((todo) => this.filterTodo(todo)),
      );
    } else if (this.isTagGroup(element)) {
      return Promise.resolve(
        element.todos.filter((todo) => this.filterTodo(todo)),
      );
    } else if (this.isCategoryGroup(element)) {
      return Promise.resolve(
        element.todos.filter((todo) => this.filterTodo(todo)),
      );
    } else if ("subtasks" in element) {
      return Promise.resolve(element.subtasks);
    } else {
      return Promise.resolve([]);
    }
  }

  private getSortedTodos(): TodoItem[] {
    return [...this.todos].sort((a, b) => this.compareTodos(a, b));
  }

  private filterTodo(todo: TodoItem): boolean {
    if (!this.filterText) return true;
    const searchLower = this.filterText.toLowerCase();
    return (
      todo.text.toLowerCase().includes(searchLower) ||
      todo.tags.some((tag) => tag.toLowerCase().includes(searchLower)) ||
      (todo.category?.toLowerCase().includes(searchLower) ?? false) ||
      (todo.notes?.toLowerCase().includes(searchLower) ?? false)
    );
  }

  private compareTodos(a: TodoItem, b: TodoItem): number {
    switch (this.sortOption) {
      case "priority": {
        const priorityDiff = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
        return priorityDiff !== 0
          ? priorityDiff
          : b.lastModified.getTime() - a.lastModified.getTime();
      }

      case "created":
        return b.created.getTime() - a.created.getTime();
      case "category": {
        if (!a.category && !b.category)
          return b.lastModified.getTime() - a.lastModified.getTime();
        if (!a.category) return 1;
        if (!b.category) return -1;
        const categoryDiff = a.category.localeCompare(b.category);
        return categoryDiff !== 0
          ? categoryDiff
          : b.lastModified.getTime() - a.lastModified.getTime();
      }
      case "lastModified":
      default:
        return b.lastModified.getTime() - a.lastModified.getTime();
    }
  }

  async toggleTodo(todo: TodoItem): Promise<void> {
    try {
      const document = await vscode.workspace.openTextDocument(todo.file);
      const edit = new vscode.WorkspaceEdit();
      const line = document.lineAt(todo.line - 1);
      const lineText = line.text;

      const strikethroughText = todo.completed
        ? lineText.replace(/~~(.+)~~/g, "$1")
        : lineText.replace(
            /(TODO:|FIXME:|BUG:|HACK:|NOTE:|OPTIMIZE:)(.+)/,
            "$1~~$2~~",
          );

      edit.replace(document.uri, line.range, strikethroughText);

      const success = await vscode.workspace.applyEdit(edit);
      if (success) {
        await document.save();
        todo.completed = !todo.completed;
        todo.lastModified = new Date();
        this.updateTodo(todo);

        if (todo.completed) {
          vscode.window.showInformationMessage(`Todo completed: ${todo.text}`);
        }
      } else {
        throw new Error("Failed to apply edit to document");
      }
    } catch (error) {
      console.error("Error toggling todo:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      vscode.window.showErrorMessage(`Error toggling todo: ${errorMessage}`);
    }
  }

  addTodo(todo: TodoItem): void {
    this.todos.push(todo);
    this.refresh();
    this.saveTodos();
  }

  updateTodo(todo: TodoItem): void {
    const index = this.todos.findIndex((t) => t.id === todo.id);
    if (index !== -1) {
      todo.lastModified = new Date();
      this.todos[index] = todo;
      this.refresh();
      this.saveTodos();
    }
  }

  deleteTodo(todo: TodoItem): void {
    this.todos = this.todos.filter((t) => t.id !== todo.id);
    this.refresh();
    this.saveTodos();
  }

  clearTodos(): void {
    this.todos = [];
    this.refresh();
    this.saveTodos();
  }

  getAllTodos(): TodoItem[] {
    return this.todos;
  }

  private loadTodos(): void {
    try {
      const todosData = this.context.globalState.get<any[]>(
        "todoify.todos",
        [],
      );
      this.todos = todosData
        .map((todoData) => {
          try {
            const todo: TodoItem = {
              id: todoData.id || generateId(),
              text: todoData.text || "",
              file: todoData.file || "",
              line: todoData.line || 1,
              completed: todoData.completed || false,
              priority: todoData.priority || "MEDIUM",
              type: todoData.type || "TODO",
              created: todoData.created
                ? new Date(todoData.created)
                : new Date(),
              lastModified: todoData.lastModified
                ? new Date(todoData.lastModified)
                : new Date(),
              tags: todoData.tags || [],
              category: todoData.category,
              subtasks: (todoData.subtasks || []).map((st: any) => ({
                id: st.id || generateId(),
                text: st.text || "",
                completed: st.completed || false,
                created: st.created ? new Date(st.created) : new Date(),
                lastModified: st.lastModified
                  ? new Date(st.lastModified)
                  : new Date(),
              })),
              notes: todoData.notes || "",
            };

            return todo;
          } catch (todoError) {
            console.error("Error parsing individual todo:", todoError);
            return null;
          }
        })
        .filter((todo): todo is TodoItem => todo !== null);

      this.refresh();
    } catch (error) {
      console.error("Error loading todos:", error);
      this.todos = [];
    }
  }

  private saveTodos(): void {
    try {
      const todosData = this.todos.map((todo) => ({
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
        subtasks: todo.subtasks.map((st) => ({
          id: st.id,
          text: st.text,
          completed: st.completed,
          created: st.created.toISOString(),
          lastModified: st.lastModified.toISOString(),
        })),
        notes: todo.notes,
      }));

      this.context.globalState.update("todoify.todos", todosData);
    } catch (error) {
      console.error("Error saving todos:", error);
    }
  }

  private updateTags(): void {
    const tagMap = new Map<string, TodoItem[]>();
    this.todos.forEach((todo) => {
      todo.tags.forEach((tag) => {
        if (!tagMap.has(tag)) {
          tagMap.set(tag, []);
        }
        tagMap.get(tag)!.push(todo);
      });
    });
    this.tags = Array.from(tagMap.entries()).map(([tag, todos]) => ({
      tag,
      todos,
    }));
  }

  getCategories(): CategoryGroup[] {
    return this.categories;
  }

  setSortOption(option: SortOption): void {
    this.sortOption = option;
    this.refresh();
  }

  setSearchFilter(text: string): void {
    this.filterText = text;
    this.refresh();
  }

  async startInlineEdit(todo: TodoItem, field: string): Promise<void> {
    try {
      const editKey = `${todo.id}:${field}`;

      if (this.editableFields.has(editKey)) {
        vscode.window.showWarningMessage("This field is already being edited");
        return;
      }

      let currentValue = "";
      let prompt = "";
      let placeholder = "";

      switch (field) {
        case "text":
          currentValue = todo.text;
          prompt = "Edit todo text:";
          placeholder = "Enter todo text...";
          break;
        case "notes":
          currentValue = todo.notes || "";
          prompt = "Edit notes:";
          placeholder = "Enter notes...";
          break;
        case "tags":
          currentValue = todo.tags.join(", ");
          prompt = "Edit tags (comma separated):";
          placeholder = "tag1, tag2, tag3...";
          break;
        default:
          vscode.window.showErrorMessage(`Field '${field}' is not editable`);
          return;
      }

      this.editableFields.set(editKey, field);

      const newValue = await vscode.window.showInputBox({
        prompt,
        value: currentValue,
        placeHolder: placeholder,
      });

      this.editableFields.delete(editKey);

      if (newValue !== undefined) {
        switch (field) {
          case "text":
            if (newValue.trim()) {
              todo.text = newValue.trim();
            } else {
              vscode.window.showErrorMessage("Todo text cannot be empty");
              return;
            }
            break;
          case "notes":
            todo.notes = newValue;
            break;
          case "tags":
            todo.tags = newValue
              .split(",")
              .map((tag) => tag.trim())
              .filter((tag) => tag.length > 0);
            break;
        }

        todo.lastModified = new Date();
        this.updateTodo(todo);
        vscode.window.showInformationMessage(`${field} updated successfully`);
      }
    } catch (error) {
      console.error(`Error editing ${field}:`, error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      vscode.window.showErrorMessage(`Error editing ${field}: ${errorMessage}`);
    }
  }
}