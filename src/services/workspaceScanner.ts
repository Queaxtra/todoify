import * as vscode from "vscode";
import { TodoItem } from "../types";
import { generateId, detectPriority } from "../utils";
import { TodoParser } from "./todoParser";

export class WorkspaceScanner {
  private static instance: WorkspaceScanner;
  private isScanning: boolean = false;
  private excludePatterns: string[] = [
    "**/node_modules/**",
    "**/dist/**",
    "**/build/**",
    "**/.git/**",
    "**/coverage/**",
    "**/.vscode/**",
    "**/*.min.js",
    "**/*.map"
  ];

  private constructor() {}

  static getInstance(): WorkspaceScanner {
    if (!WorkspaceScanner.instance) {
      WorkspaceScanner.instance = new WorkspaceScanner();
    }
    return WorkspaceScanner.instance;
  }

  setExcludePatterns(patterns: string[]): void {
    this.excludePatterns = patterns;
  }

  addExcludePattern(pattern: string): void {
    if (!this.excludePatterns.includes(pattern)) {
      this.excludePatterns.push(pattern);
    }
  }

  removeExcludePattern(pattern: string): void {
    this.excludePatterns = this.excludePatterns.filter(p => p !== pattern);
  }

  getExcludePatterns(): string[] {
    return [...this.excludePatterns];
  }

  isCurrentlyScanning(): boolean {
    return this.isScanning;
  }

  async scanWorkspace(existingTodos: TodoItem[] = []): Promise<TodoItem[]> {
    if (this.isScanning) {
      throw new Error("Scan already in progress");
    }

    this.isScanning = true;
    
    try {
      const existingTodoMap = this.createExistingTodoMap(existingTodos);
      const files = await this.getWorkspaceFiles();
      const processedFiles = new Set<string>();
      const todos: TodoItem[] = [];

      const batchSize = 50;
      for (let i = 0; i < files.length; i += batchSize) {
        const batch = files.slice(i, i + batchSize);
        const batchPromises = batch.map(file => 
          this.processFile(file, existingTodoMap, processedFiles)
        );
        
        const batchResults = await Promise.all(batchPromises);
        todos.push(...batchResults.flat());
      }

      return this.deduplicateTodos(todos);
    } finally {
      this.isScanning = false;
    }
  }

  async scanSingleFile(filePath: string, existingTodos: TodoItem[] = []): Promise<TodoItem[]> {
    const existingTodoMap = this.createExistingTodoMap(existingTodos);
    const uri = vscode.Uri.file(filePath);
    const processedFiles = new Set<string>();
    
    return await this.processFile(uri, existingTodoMap, processedFiles);
  }

  private createExistingTodoMap(existingTodos: TodoItem[]): Map<string, TodoItem> {
    const map = new Map<string, TodoItem>();
    existingTodos.forEach(todo => {
      const key = `${todo.file}:${todo.line}`;
      map.set(key, todo);
    });
    return map;
  }

  private async getWorkspaceFiles(): Promise<vscode.Uri[]> {
    const includePattern = "**/*.*";
    const excludePattern = `{${this.excludePatterns.join(",")}}`;
    
    return await vscode.workspace.findFiles(includePattern, excludePattern);
  }

  private async processFile(
    file: vscode.Uri, 
    existingTodoMap: Map<string, TodoItem>, 
    processedFiles: Set<string>
  ): Promise<TodoItem[]> {
    try {
      if (processedFiles.has(file.fsPath)) {
        return [];
      }
      processedFiles.add(file.fsPath);

      if (!this.isValidFileType(file.fsPath)) {
        return [];
      }

      const document = await vscode.workspace.openTextDocument(file);
      const text = document.getText();
      
      if (text.length > 1000000) {
        console.warn(`Skipping large file: ${file.fsPath}`);
        return [];
      }

      const lines = text.split("\n");
      const todos: TodoItem[] = [];

      lines.forEach((line, index) => {
        try {
          const match = TodoParser.getKeywordMatch(line);
          if (!match) return;

          const key = `${file.fsPath}:${index + 1}`;
          const existingTodo = existingTodoMap.get(key);

          const todo: TodoItem = {
            id: existingTodo?.id || generateId(),
            text: match.text,
            file: file.fsPath,
            line: index + 1,
            completed: existingTodo?.completed || false,
            priority: existingTodo?.priority || detectPriority(match.text),
            type: match.type,
            created: existingTodo?.created || new Date(),
            lastModified: existingTodo?.lastModified || new Date(),
            tags: match.tags || existingTodo?.tags || [],
            category: match.category || existingTodo?.category,
            subtasks: existingTodo?.subtasks || [],
            notes: match.notes || existingTodo?.notes || "",
          };

          todos.push(todo);
        } catch (lineError) {
          console.error(`Error processing line ${index + 1} in ${file.fsPath}:`, lineError);
        }
      });

      return todos;
    } catch (fileError) {
      console.error(`Error processing file: ${file.fsPath}`, fileError);
      return [];
    }
  }

  private isValidFileType(filePath: string): boolean {
    const validExtensions = [
      ".ts", ".js", ".tsx", ".jsx", ".vue", ".py", ".java", ".cpp", ".c",
      ".cs", ".php", ".rb", ".go", ".rs", ".swift", ".kt", ".scala",
      ".html", ".css", ".scss", ".sass", ".less", ".md", ".txt",
      ".yml", ".yaml", ".json", ".xml", ".sql", ".sh", ".ps1",
      ".dart", ".r", ".m", ".pl", ".lua", ".elm", ".ex", ".exs"
    ];

    const binaryExtensions = [
      ".jpg", ".jpeg", ".png", ".gif", ".bmp", ".svg", ".ico",
      ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx",
      ".zip", ".rar", ".tar", ".gz", ".7z", ".exe", ".dll", ".so",
      ".dylib", ".bin", ".dat", ".db", ".sqlite", ".mp3", ".mp4",
      ".avi", ".mov", ".wav", ".flac", ".ogg", ".webm", ".woff",
      ".woff2", ".ttf", ".otf", ".eot"
    ];

    const ext = filePath.toLowerCase().substring(filePath.lastIndexOf("."));
    
    if (binaryExtensions.includes(ext)) {
      return false;
    }

    return validExtensions.includes(ext) || !ext;
  }

  private deduplicateTodos(todos: TodoItem[]): TodoItem[] {
    const uniqueTodos = new Map<string, TodoItem>();
    
    todos.forEach(todo => {
      const key = `${todo.file}:${todo.line}`;
      if (!uniqueTodos.has(key)) {
        uniqueTodos.set(key, todo);
      }
    });

    return Array.from(uniqueTodos.values());
  }

  async getFileStats(): Promise<{
    totalFiles: number;
    scannableFiles: number;
    excludedFiles: number;
  }> {
    try {
      const allFiles = await vscode.workspace.findFiles("**/*.*");
      const scannableFiles = allFiles.filter(file => this.isValidFileType(file.fsPath));
      
      return {
        totalFiles: allFiles.length,
        scannableFiles: scannableFiles.length,
        excludedFiles: allFiles.length - scannableFiles.length
      };
    } catch (error) {
      console.error("Error getting file stats:", error);
      return {
        totalFiles: 0,
        scannableFiles: 0,
        excludedFiles: 0
      };
    }
  }

  async estimateScanTime(): Promise<number> {
    const stats = await this.getFileStats();
    const averageTimePerFile = 10;
    return stats.scannableFiles * averageTimePerFile;
  }
}