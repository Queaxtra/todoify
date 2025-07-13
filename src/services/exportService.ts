import * as vscode from "vscode";
import { TodoItem } from "../types";
import { PRIORITY_COLORS } from "../constants";

export class ExportService {
  private static instance: ExportService;

  private constructor() {}

  static getInstance(): ExportService {
    if (!ExportService.instance) {
      ExportService.instance = new ExportService();
    }
    return ExportService.instance;
  }

  async exportTodos(todos: TodoItem[], format: "JSON" | "Markdown" | "CSV"): Promise<void> {
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

  private exportToJSON(todos: TodoItem[]): string {
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

  private exportToMarkdown(todos: TodoItem[]): string {
    const sections = this.groupTodosByCategory(todos);
    let content = "# Todo Export\n\n";
    content += `Generated on: ${new Date().toLocaleString()}\n`;
    content += `Total todos: ${todos.length}\n\n`;

    Object.entries(sections).forEach(([category, categoryTodos]) => {
      content += `## ${category}\n\n`;
      
      categoryTodos.forEach(todo => {
        const status = todo.completed ? "✅" : "⬜";
        const priority = PRIORITY_COLORS[todo.priority];
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

  private exportToCSV(todos: TodoItem[]): string {
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
      this.escapeCsvField(todo.subtasks.map(st => 
        `${st.completed ? "✅" : "⬜"} ${st.text}`
      ).join("; "))
    ]);

    return [headers.join(","), ...rows.map(row => row.join(","))].join("\n");
  }

  private escapeCsvField(field: string): string {
    if (field.includes(",") || field.includes('"') || field.includes("\n")) {
      return `"${field.replace(/"/g, '""')}"`;
    }
    return field;
  }

  private groupTodosByCategory(todos: TodoItem[]): Record<string, TodoItem[]> {
    const groups: Record<string, TodoItem[]> = {};
    
    todos.forEach(todo => {
      const category = todo.category || "Uncategorized";
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(todo);
    });

    return groups;
  }

  private async saveToFile(content: string, format: string): Promise<void> {
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
      } catch (error) {
        console.error("Error exporting todos:", error);
        vscode.window.showErrorMessage("Error exporting todos");
      }
    }
  }

  async getExportPreview(todos: TodoItem[], format: "JSON" | "Markdown" | "CSV"): Promise<string> {
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

  getExportStats(todos: TodoItem[]): {
    totalTodos: number;
    completedTodos: number;
    pendingTodos: number;
    categoriesCount: number;
    tagsCount: number;
    priorityBreakdown: Record<string, number>;
    typeBreakdown: Record<string, number>;
  } {
    const categories = new Set(todos.map(t => t.category || "Uncategorized"));
    const tags = new Set(todos.flatMap(t => t.tags));
    
    const priorityBreakdown: Record<string, number> = { HIGH: 0, MEDIUM: 0, LOW: 0 };
    const typeBreakdown: Record<string, number> = {};

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