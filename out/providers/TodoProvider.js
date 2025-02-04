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
exports.TodoProvider = void 0;
const vscode = __importStar(require("vscode"));
const icons_1 = require("../constants/icons");
const todoUtils_1 = require("../utils/todoUtils");
class TodoProvider {
    _onDidChangeTreeData = new vscode.EventEmitter();
    onDidChangeTreeData = this._onDidChangeTreeData.event;
    todos = [];
    filterText = '';
    sortOption = 'lastModified';
    categories = new Map();
    tags = new Map();
    context;
    constructor(context) {
        this.context = context;
        this.loadTodos();
    }
    refresh() {
        this._onDidChangeTreeData.fire(undefined);
        this.updateCategories();
        this.updateTags();
    }
    updateCategories() {
        this.categories.clear();
        this.todos.forEach(todo => {
            if (todo.category) {
                if (!this.categories.has(todo.category)) {
                    this.categories.set(todo.category, []);
                }
                const categoryTodos = this.categories.get(todo.category);
                if (categoryTodos) {
                    categoryTodos.push(todo);
                }
            }
        });
    }
    getTreeItem(element) {
        if (this.isSubTask(element)) {
            return this.getSubTaskTreeItem(element);
        }
        return this.getTodoTreeItem(element);
    }
    isSubTask(element) {
        return 'id' in element && !('file' in element);
    }
    getSubTaskTreeItem(element) {
        return {
            label: element.text,
            iconPath: new vscode.ThemeIcon(element.completed ? 'check' : 'circle-outline'),
            collapsibleState: vscode.TreeItemCollapsibleState.None,
            contextValue: 'subtask',
            tooltip: `Created: ${element.created.toLocaleString()}\nLast Modified: ${element.lastModified.toLocaleString()}`
        };
    }
    getTodoTreeItem(element) {
        const { type, completed, text } = element;
        const tooltip = new vscode.MarkdownString()
            .appendMarkdown(`**${text}**\n\n`)
            .appendMarkdown(`Type: ${type}\n`)
            .appendMarkdown(`Priority: ${element.priority}\n`)
            .appendMarkdown(`Created: ${element.created.toLocaleString()}\n`)
            .appendMarkdown(`Last Modified: ${element.lastModified.toLocaleString()}\n`);
        if (element.dueDate) {
            tooltip.appendMarkdown(`Due Date: ${element.dueDate.toLocaleString()}\n`);
        }
        if (element.category) {
            tooltip.appendMarkdown(`Category: ${element.category}\n`);
        }
        if (element.notes) {
            tooltip.appendMarkdown(`\nNotes: ${element.notes}\n`);
        }
        return {
            label: completed ? (0, todoUtils_1.strikeThrough)(text) : text,
            iconPath: new vscode.ThemeIcon(icons_1.TODO_ICONS[type]),
            collapsibleState: element.subtasks.length ?
                vscode.TreeItemCollapsibleState.Collapsed :
                vscode.TreeItemCollapsibleState.None,
            contextValue: 'todo',
            checkboxState: completed ? vscode.TreeItemCheckboxState.Checked : vscode.TreeItemCheckboxState.Unchecked,
            command: { command: 'todoify.toggleTodo', title: 'Toggle Todo', arguments: [element] },
            description: this.getTodoDescription(element),
            tooltip
        };
    }
    getTodoDescription(todo) {
        const parts = [];
        if (todo.priority === 'HIGH') {
            parts.push('🔴');
        }
        else if (todo.priority === 'MEDIUM') {
            parts.push('🟡');
        }
        if (todo.dueDate) {
            const now = new Date();
            const dueDate = new Date(todo.dueDate);
            if (dueDate < now) {
                parts.push('⚠️ Overdue');
            }
            else {
                parts.push(`📅 ${dueDate.toLocaleDateString()}`);
            }
        }
        if (todo.tags.length > 0) {
            parts.push(`🏷️ ${todo.tags.join(', ')}`);
        }
        if (todo.notes) {
            parts.push(`📝 ${todo.notes.substring(0, 30)}${todo.notes.length > 30 ? '...' : ''}`);
        }
        return parts.join(' | ');
    }
    getChildren(element) {
        if (!element) {
            return this.getSortedTodos();
        }
        if (this.isSubTask(element)) {
            return [];
        }
        return element.subtasks;
    }
    getSortedTodos() {
        return this.todos
            .filter(todo => this.filterTodo(todo))
            .sort((a, b) => this.compareTodos(a, b));
    }
    filterTodo(todo) {
        if (!this.filterText)
            return true;
        const searchText = this.filterText.toLowerCase();
        return todo.text.toLowerCase().includes(searchText) ||
            todo.tags.some(tag => tag.toLowerCase().includes(searchText)) ||
            (todo.category?.toLowerCase().includes(searchText) ?? false) ||
            (todo.notes?.toLowerCase().includes(searchText) ?? false) ||
            todo.subtasks.some(st => st.text.toLowerCase().includes(searchText));
    }
    compareTodos(a, b) {
        switch (this.sortOption) {
            case 'priority': {
                const priorityOrder = { HIGH: 1, MEDIUM: 2, LOW: 3 };
                const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
                return priorityDiff !== 0 ? priorityDiff : b.lastModified.getTime() - a.lastModified.getTime();
            }
            case 'dueDate': {
                if (!a.dueDate && !b.dueDate)
                    return b.lastModified.getTime() - a.lastModified.getTime();
                if (!a.dueDate)
                    return 1;
                if (!b.dueDate)
                    return -1;
                const dueDateDiff = a.dueDate.getTime() - b.dueDate.getTime();
                return dueDateDiff !== 0 ? dueDateDiff : b.lastModified.getTime() - a.lastModified.getTime();
            }
            case 'created':
                return b.created.getTime() - a.created.getTime();
            case 'category': {
                if (!a.category && !b.category)
                    return b.lastModified.getTime() - a.lastModified.getTime();
                if (!a.category)
                    return 1;
                if (!b.category)
                    return -1;
                const categoryDiff = a.category.localeCompare(b.category);
                return categoryDiff !== 0 ? categoryDiff : b.lastModified.getTime() - a.lastModified.getTime();
            }
            case 'lastModified':
            default:
                return b.lastModified.getTime() - a.lastModified.getTime();
        }
    }
    async toggleTodo(item) {
        try {
            item.completed = !item.completed;
            if (item.completed) {
                const document = await vscode.workspace.openTextDocument(item.file);
                const edit = new vscode.WorkspaceEdit();
                const line = document.lineAt(item.line - 1);
                const lineRange = line.rangeIncludingLineBreak;
                edit.delete(document.uri, lineRange);
                const success = await vscode.workspace.applyEdit(edit);
                if (success) {
                    this.deleteTodo(item);
                    await document.save();
                    vscode.window.showInformationMessage(`"${item.text}" task completed and deleted`);
                }
                else {
                    throw new Error('Changes could not be applied');
                }
            }
            else {
                this.updateTodo(item);
            }
        }
        catch (error) {
            console.error('Error processing todo:', error);
            vscode.window.showErrorMessage('Error processing todo');
            item.completed = !item.completed;
            this.updateTodo(item);
        }
    }
    addTodo(todo) {
        this.todos.push(todo);
        this.saveTodos();
        this.updateTags();
        this.refresh();
    }
    updateTodo(todo) {
        const index = this.todos.findIndex(t => t.id === todo.id);
        if (index !== -1) {
            todo.lastModified = new Date();
            this.todos[index] = todo;
            this.saveTodos();
            this.updateTags();
            this.refresh();
        }
    }
    deleteTodo(item) {
        this.todos = this.todos.filter(t => t.id !== item.id);
        this.saveTodos();
        this.updateTags();
        this.refresh();
    }
    clearTodos() {
        this.todos = [];
        this.saveTodos();
        this.refresh();
    }
    getAllTodos() {
        return [...this.todos];
    }
    loadTodos() {
        try {
            const savedTodos = this.context.globalState.get('todos', []) || [];
            this.todos = savedTodos.map(todo => {
                const mappedTodo = {
                    id: todo.id || (0, todoUtils_1.generateId)(),
                    text: todo.text || '',
                    file: todo.file || '',
                    line: todo.line || 0,
                    completed: todo.completed || false,
                    priority: todo.priority || 'LOW',
                    type: todo.type || 'TODO',
                    created: new Date(todo.created || new Date()),
                    lastModified: new Date(todo.lastModified || todo.created || new Date()),
                    tags: Array.isArray(todo.tags) ? todo.tags : [],
                    category: todo.category,
                    subtasks: [],
                    notes: todo.notes || ''
                };
                if (todo.dueDate) {
                    try {
                        mappedTodo.dueDate = new Date(todo.dueDate);
                    }
                    catch (e) {
                        console.error('Invalid due date:', e);
                    }
                }
                if (todo.reminder) {
                    try {
                        mappedTodo.reminder = new Date(todo.reminder);
                    }
                    catch (e) {
                        console.error('Invalid reminder:', e);
                    }
                }
                if (Array.isArray(todo.subtasks)) {
                    mappedTodo.subtasks = todo.subtasks.map(st => ({
                        id: st.id || (0, todoUtils_1.generateId)(),
                        text: st.text || '',
                        completed: st.completed || false,
                        created: new Date(st.created || new Date()),
                        lastModified: new Date(st.lastModified || st.created || new Date())
                    }));
                }
                return mappedTodo;
            });
            this.updateCategories();
        }
        catch (error) {
            console.error('Error loading todos:', error);
            this.todos = [];
            vscode.window.showErrorMessage('Error loading todos');
        }
    }
    saveTodos() {
        try {
            const todosToSave = this.todos.map(todo => ({
                ...todo,
                created: todo.created.toISOString(),
                lastModified: todo.lastModified.toISOString(),
                dueDate: todo.dueDate?.toISOString(),
                reminder: todo.reminder?.toISOString(),
                subtasks: todo.subtasks.map(st => ({
                    ...st,
                    created: st.created.toISOString(),
                    lastModified: st.lastModified.toISOString()
                }))
            }));
            this.context.globalState.update('todos', todosToSave);
        }
        catch (error) {
            console.error('Error saving todos:', error);
            vscode.window.showErrorMessage('Error saving todos');
        }
    }
    updateTags() {
        this.tags.clear();
        this.todos.forEach(todo => {
            todo.tags.forEach(tag => {
                if (!this.tags.has(tag)) {
                    this.tags.set(tag, []);
                }
                this.tags.get(tag)?.push(todo);
            });
        });
    }
    getCategories() {
        return Array.from(this.categories.keys());
    }
    setSortOption(option) {
        this.sortOption = option;
        this.refresh();
    }
    setSearchFilter(text) {
        this.filterText = text;
        this.refresh();
    }
    async startInlineEdit(element, field) {
        let value = '';
        let prompt = '';
        let placeHolder = '';
        switch (field) {
            case 'text':
                value = element.text;
                prompt = 'Edit todo text';
                placeHolder = 'New todo text';
                break;
            case 'notes':
                value = element.notes || '';
                prompt = 'Add/edit notes';
                placeHolder = 'New notes';
                break;
            case 'tags':
                value = element.tags.join(', ');
                prompt = 'Edit tags (comma separated)';
                placeHolder = 'tag1, tag2, ...';
                break;
            default:
                return;
        }
        const newValue = await vscode.window.showInputBox({
            value,
            prompt,
            placeHolder
        });
        if (newValue !== undefined) {
            try {
                const document = await vscode.workspace.openTextDocument(element.file);
                const edit = new vscode.WorkspaceEdit();
                const line = document.lineAt(element.line - 1);
                const lineText = line.text;
                const todoMatch = (0, todoUtils_1.getKeywordMatch)(lineText);
                if (!todoMatch) {
                    throw new Error('Todo line not found');
                }
                const keywordIndex = Object.keys(icons_1.TODO_KEYWORDS).find(keyword => lineText.indexOf(keyword) !== -1);
                if (!keywordIndex) {
                    throw new Error('Todo keyword not found');
                }
                const todoStartIndex = lineText.indexOf(keywordIndex);
                const beforeTodo = lineText.substring(0, todoStartIndex + keywordIndex.length);
                const existingTags = lineText.match(/#[\w-]+/g) || [];
                const existingNoteMatch = lineText.match(/\/\/\s*(.*?)(?=\s*(?:#|$))/);
                const existingNote = existingNoteMatch ? existingNoteMatch[1].trim() : '';
                let newLineText = '';
                switch (field) {
                    case 'text':
                        newLineText = `${beforeTodo} ${newValue}`;
                        if (existingTags.length > 0) {
                            newLineText += ` ${existingTags.join(' ')}`;
                        }
                        if (existingNote) {
                            newLineText += ` // ${existingNote}`;
                        }
                        element.text = newValue;
                        break;
                    case 'notes':
                        newLineText = lineText.replace(/\/\/.*$/, '').trim();
                        if (newValue) {
                            newLineText += ` // ${newValue}`;
                        }
                        element.notes = newValue;
                        break;
                    case 'tags':
                        newLineText = lineText.replace(/#[\w-]+/g, '').trim();
                        const tagString = newValue.split(',')
                            .map(t => t.trim())
                            .filter(t => t)
                            .map(t => `#${t}`)
                            .join(' ');
                        if (tagString) {
                            if (existingNote) {
                                newLineText = newLineText.replace(/\/\/.*$/, '').trim();
                                newLineText += ` ${tagString} // ${existingNote}`;
                            }
                            else {
                                newLineText += ` ${tagString}`;
                            }
                        }
                        element.tags = newValue.split(',').map(t => t.trim()).filter(t => t);
                        break;
                }
                newLineText = newLineText.replace(/\s+/g, ' ').trim();
                edit.replace(document.uri, line.range, newLineText);
                const success = await vscode.workspace.applyEdit(edit);
                if (success) {
                    await document.save();
                    this.updateTodo(element);
                    vscode.window.showInformationMessage('Todo updated successfully');
                }
                else {
                    throw new Error('Changes could not be applied');
                }
            }
            catch (error) {
                console.error('Error updating todo:', error);
                vscode.window.showErrorMessage('Error updating todo');
            }
        }
    }
}
exports.TodoProvider = TodoProvider;
//# sourceMappingURL=TodoProvider.js.map