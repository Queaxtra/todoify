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
exports.WorkspaceScanner = void 0;
const vscode = __importStar(require("vscode"));
const utils_1 = require("../utils");
const todoParser_1 = require("./todoParser");
class WorkspaceScanner {
    static instance;
    isScanning = false;
    excludePatterns = [
        "**/node_modules/**",
        "**/dist/**",
        "**/build/**",
        "**/.git/**",
        "**/coverage/**",
        "**/.vscode/**",
        "**/*.min.js",
        "**/*.map"
    ];
    constructor() { }
    static getInstance() {
        if (!WorkspaceScanner.instance) {
            WorkspaceScanner.instance = new WorkspaceScanner();
        }
        return WorkspaceScanner.instance;
    }
    setExcludePatterns(patterns) {
        this.excludePatterns = patterns;
    }
    addExcludePattern(pattern) {
        if (!this.excludePatterns.includes(pattern)) {
            this.excludePatterns.push(pattern);
        }
    }
    removeExcludePattern(pattern) {
        this.excludePatterns = this.excludePatterns.filter(p => p !== pattern);
    }
    getExcludePatterns() {
        return [...this.excludePatterns];
    }
    isCurrentlyScanning() {
        return this.isScanning;
    }
    async scanWorkspace(existingTodos = []) {
        if (this.isScanning) {
            throw new Error("Scan already in progress");
        }
        this.isScanning = true;
        try {
            const existingTodoMap = this.createExistingTodoMap(existingTodos);
            const files = await this.getWorkspaceFiles();
            const processedFiles = new Set();
            const todos = [];
            const batchSize = 50;
            for (let i = 0; i < files.length; i += batchSize) {
                const batch = files.slice(i, i + batchSize);
                const batchPromises = batch.map(file => this.processFile(file, existingTodoMap, processedFiles));
                const batchResults = await Promise.all(batchPromises);
                todos.push(...batchResults.flat());
            }
            return this.deduplicateTodos(todos);
        }
        finally {
            this.isScanning = false;
        }
    }
    async scanSingleFile(filePath, existingTodos = []) {
        const existingTodoMap = this.createExistingTodoMap(existingTodos);
        const uri = vscode.Uri.file(filePath);
        const processedFiles = new Set();
        return await this.processFile(uri, existingTodoMap, processedFiles);
    }
    createExistingTodoMap(existingTodos) {
        const map = new Map();
        existingTodos.forEach(todo => {
            const key = `${todo.file}:${todo.line}`;
            map.set(key, todo);
        });
        return map;
    }
    async getWorkspaceFiles() {
        const includePattern = "**/*.*";
        const excludePattern = `{${this.excludePatterns.join(",")}}`;
        return await vscode.workspace.findFiles(includePattern, excludePattern);
    }
    async processFile(file, existingTodoMap, processedFiles) {
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
            const todos = [];
            lines.forEach((line, index) => {
                try {
                    const match = todoParser_1.TodoParser.getKeywordMatch(line);
                    if (!match)
                        return;
                    const key = `${file.fsPath}:${index + 1}`;
                    const existingTodo = existingTodoMap.get(key);
                    const todo = {
                        id: existingTodo?.id || (0, utils_1.generateId)(),
                        text: match.text,
                        file: file.fsPath,
                        line: index + 1,
                        completed: existingTodo?.completed || false,
                        priority: existingTodo?.priority || (0, utils_1.detectPriority)(match.text),
                        type: match.type,
                        created: existingTodo?.created || new Date(),
                        lastModified: existingTodo?.lastModified || new Date(),
                        tags: match.tags || existingTodo?.tags || [],
                        category: match.category || existingTodo?.category,
                        subtasks: existingTodo?.subtasks || [],
                        notes: match.notes || existingTodo?.notes || "",
                    };
                    todos.push(todo);
                }
                catch (lineError) {
                    console.error(`Error processing line ${index + 1} in ${file.fsPath}:`, lineError);
                }
            });
            return todos;
        }
        catch (fileError) {
            console.error(`Error processing file: ${file.fsPath}`, fileError);
            return [];
        }
    }
    isValidFileType(filePath) {
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
    deduplicateTodos(todos) {
        const uniqueTodos = new Map();
        todos.forEach(todo => {
            const key = `${todo.file}:${todo.line}`;
            if (!uniqueTodos.has(key)) {
                uniqueTodos.set(key, todo);
            }
        });
        return Array.from(uniqueTodos.values());
    }
    async getFileStats() {
        try {
            const allFiles = await vscode.workspace.findFiles("**/*.*");
            const scannableFiles = allFiles.filter(file => this.isValidFileType(file.fsPath));
            return {
                totalFiles: allFiles.length,
                scannableFiles: scannableFiles.length,
                excludedFiles: allFiles.length - scannableFiles.length
            };
        }
        catch (error) {
            console.error("Error getting file stats:", error);
            return {
                totalFiles: 0,
                scannableFiles: 0,
                excludedFiles: 0
            };
        }
    }
    async estimateScanTime() {
        const stats = await this.getFileStats();
        const averageTimePerFile = 10;
        return stats.scannableFiles * averageTimePerFile;
    }
}
exports.WorkspaceScanner = WorkspaceScanner;
//# sourceMappingURL=workspaceScanner.js.map