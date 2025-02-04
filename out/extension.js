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
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
var Todoify;
(function (Todoify) {
    Todoify.TODO_ICONS = {
        'TODO': 'tasklist',
        'FIXME': 'tools',
        'BUG': 'bug',
        'HACK': 'zap',
        'NOTE': 'note',
        'OPTIMIZE': 'rocket'
    };
    Todoify.PRIORITY_ICONS = {
        'HIGH': '●',
        'MEDIUM': '●',
        'LOW': '●'
    };
    Todoify.TODO_KEYWORDS = {
        'TODO:': 'TODO',
        'FIXME:': 'FIXME',
        'BUG:': 'BUG',
        'HACK:': 'HACK',
        'NOTE:': 'NOTE',
        'OPTIMIZE:': 'OPTIMIZE'
    };
})(Todoify || (Todoify = {}));
class TodoTreeProvider {
    _onDidChangeTreeData = new vscode.EventEmitter();
    onDidChangeTreeData = this._onDidChangeTreeData.event;
    todos = [];
    filterText = '';
    sortOption = 'lastModified';
    categories = new Map();
    tags = new Map();
    context;
    todoIconPath;
    editableFields = ['text', 'notes', 'tags'];
    constructor(context) {
        this.context = context;
        this.todoIconPath = vscode.Uri.file(path.join(context.extensionPath, 'resources', 'icon.png'));
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
                this.categories.get(todo.category)?.push(todo);
            }
        });
    }
    getTreeItem(element) {
        if (this.isSubTask(element)) {
            return this.getSubTaskTreeItem(element);
        }
        if (this.isTagGroup(element)) {
            return this.getTagGroupTreeItem(element);
        }
        if (this.isCategoryGroup(element)) {
            return this.getCategoryGroupTreeItem(element);
        }
        return this.getTodoTreeItem(element);
    }
    isSubTask(element) {
        return 'id' in element && !('file' in element);
    }
    isTagGroup(element) {
        return 'tag' in element && 'todos' in element;
    }
    isCategoryGroup(element) {
        return 'category' in element && 'todos' in element;
    }
    getSubTaskTreeItem(element) {
        return {
            label: element.text,
            iconPath: new vscode.ThemeIcon(element.completed ? 'check' : 'circle-outline'),
            collapsibleState: vscode.TreeItemCollapsibleState.None,
            contextValue: 'subtask'
        };
    }
    getTagGroupTreeItem(element) {
        return {
            label: element.tag,
            iconPath: new vscode.ThemeIcon('tag'),
            description: `(${element.todos.length})`,
            collapsibleState: vscode.TreeItemCollapsibleState.Collapsed,
            contextValue: 'tagGroup',
            tooltip: new vscode.MarkdownString()
                .appendMarkdown(`**${element.tag}** tag\n\n`)
                .appendMarkdown(`Total: ${element.todos.length} todos`)
        };
    }
    getCategoryGroupTreeItem(element) {
        return {
            label: element.category,
            iconPath: new vscode.ThemeIcon('folder'),
            description: `(${element.todos.length})`,
            collapsibleState: vscode.TreeItemCollapsibleState.Collapsed,
            contextValue: 'categoryGroup',
            tooltip: new vscode.MarkdownString()
                .appendMarkdown(`**${element.category}** category\n\n`)
                .appendMarkdown(`Total: ${element.todos.length} todos`)
        };
    }
    getTodoTreeItem(element) {
        const { type, completed, text } = element;
        const treeItem = {
            label: completed ? strikeThrough(text) : text,
            iconPath: new vscode.ThemeIcon(Todoify.TODO_ICONS[type]),
            collapsibleState: element.subtasks.length ?
                vscode.TreeItemCollapsibleState.Collapsed :
                vscode.TreeItemCollapsibleState.None,
            contextValue: 'todo',
            checkboxState: completed ? vscode.TreeItemCheckboxState.Checked : vscode.TreeItemCheckboxState.Unchecked,
            command: { command: 'todoify.toggleTodo', title: 'Toggle Todo', arguments: [element] },
            description: this.getTodoDescription(element)
        };
        return treeItem;
    }
    getTodoDescription(todo) {
        const parts = [];
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
            const categoryGroups = Array.from(this.categories.entries()).map(([category, todos]) => ({
                category,
                todos
            }));
            const tagGroups = Array.from(this.tags.entries()).map(([tag, todos]) => ({
                tag,
                todos
            }));
            const uncategorizedTodos = this.getSortedTodos().filter(todo => !todo.category);
            return [...categoryGroups, ...tagGroups, ...uncategorizedTodos];
        }
        if (this.isCategoryGroup(element)) {
            return element.todos;
        }
        if (this.isTagGroup(element)) {
            return element.todos;
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
                    id: todo.id || generateId(),
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
                        id: st.id || generateId(),
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
                const todoMatch = getKeywordMatch(lineText);
                if (!todoMatch) {
                    throw new Error('Todo line not found');
                }
                const keywordIndex = Object.keys(Todoify.TODO_KEYWORDS).find(keyword => lineText.indexOf(keyword) !== -1);
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
function generateId() {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
}
function scheduleReminder(todo) {
    if (!todo.reminder)
        return;
    const now = new Date();
    const delay = todo.reminder.getTime() - now.getTime();
    if (delay <= 0)
        return;
    setTimeout(() => {
        vscode.window.showInformationMessage(`Reminder: ${todo.text}`, 'OK', 'Snooze').then(selection => {
            if (selection === 'Snooze') {
                todo.reminder = new Date(Date.now() + 30 * 60000);
                scheduleReminder(todo);
            }
        });
    }, delay);
}
function checkReminders(provider) {
    const now = new Date();
    provider.getChildren().forEach(item => {
        if (item instanceof Object && 'reminder' in item && item.reminder) {
            const todo = item;
            if (todo.reminder && todo.reminder.getTime() <= now.getTime()) {
                vscode.window.showInformationMessage(`Reminder: ${todo.text}`, 'OK', 'Snooze').then(selection => {
                    if (selection === 'Snooze') {
                        todo.reminder = new Date(Date.now() + 30 * 60000);
                        provider.updateTodo(todo);
                    }
                });
            }
        }
    });
}
async function findTodosInWorkspace(provider) {
    try {
        const existingTodos = provider.getAllTodos();
        const existingTodoMap = new Map();
        existingTodos.forEach(todo => {
            const key = `${todo.file}:${todo.line}`;
            existingTodoMap.set(key, todo);
        });
        const files = await vscode.workspace.findFiles('**/*.*', '**/node_modules/**');
        const processedFiles = new Set();
        const promises = files.map(async (file) => {
            try {
                if (processedFiles.has(file.fsPath)) {
                    return [];
                }
                processedFiles.add(file.fsPath);
                const document = await vscode.workspace.openTextDocument(file);
                const text = document.getText();
                const lines = text.split('\n');
                return lines.map((line, index) => {
                    try {
                        const match = getKeywordMatch(line);
                        if (!match)
                            return null;
                        const key = `${file.fsPath}:${index + 1}`;
                        const existingTodo = existingTodoMap.get(key);
                        const todo = {
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
                            notes: match.notes || existingTodo?.notes || '',
                            dueDate: existingTodo?.dueDate,
                            reminder: existingTodo?.reminder
                        };
                        return todo;
                    }
                    catch (lineError) {
                        console.error(`Error processing line: ${index + 1}`, lineError);
                        return null;
                    }
                }).filter((todo) => todo !== null);
            }
            catch (fileError) {
                console.error(`Error processing file: ${file.fsPath}`, fileError);
                return [];
            }
        });
        const todoArrays = await Promise.all(promises);
        const todos = todoArrays.flat();
        const uniqueTodos = new Map();
        todos.forEach(todo => {
            const key = `${todo.file}:${todo.line}`;
            if (!uniqueTodos.has(key)) {
                uniqueTodos.set(key, todo);
            }
        });
        provider.clearTodos();
        Array.from(uniqueTodos.values()).forEach(todo => provider.addTodo(todo));
    }
    catch (error) {
        console.error('Error scanning todos:', error);
        vscode.window.showErrorMessage('Error scanning todos');
    }
}
function getKeywordMatch(line) {
    try {
        for (const [keyword, type] of Object.entries(Todoify.TODO_KEYWORDS)) {
            const index = line.indexOf(keyword);
            if (index === -1)
                continue;
            const beforeKeyword = line.substring(0, index).trim();
            let category;
            let text = line.substring(index + keyword.length);
            const categoryMatch = beforeKeyword.match(/\[(.*?)\]/);
            if (categoryMatch) {
                category = categoryMatch[1].trim();
            }
            const parts = text.split('//').map(part => part.trim());
            text = parts[0];
            const notes = parts[1] || undefined;
            const tags = text.match(/#[\w-]+/g)?.map(tag => tag.substring(1)) || [];
            text = text.replace(/#[\w-]+/g, '').trim();
            return {
                type,
                text,
                category,
                tags,
                notes
            };
        }
    }
    catch (error) {
        console.error('Error parsing todo:', error);
    }
    return null;
}
function detectPriority(text) {
    try {
        if (text.includes('!!!') || text.includes('(HIGH)') || /#high\b/i.test(text)) {
            return 'HIGH';
        }
        if (text.includes('!!') || text.includes('(MEDIUM)') || /#medium\b/i.test(text)) {
            return 'MEDIUM';
        }
        if (text.includes('!') || text.includes('(LOW)') || /#low\b/i.test(text)) {
            return 'LOW';
        }
    }
    catch (error) {
        console.error('Error detecting priority:', error);
    }
    return 'LOW';
}
function strikeThrough(text) {
    return text.split('').join('\u0336') + '\u0336';
}
function activate(context) {
    const todoProvider = new TodoTreeProvider(context);
    const treeView = vscode.window.createTreeView('todoify', {
        treeDataProvider: todoProvider
    });
    const commands = [
        ['todoify.focus', () => {
                vscode.commands.executeCommand('workbench.view.extension.todoify');
            }],
        ['todoify.refresh', () => { findTodosInWorkspace(todoProvider); }],
        ['todoify.search', async () => {
                const searchText = await vscode.window.showInputBox({
                    prompt: 'Enter text to search',
                    placeHolder: 'Search for todo, tag or category...'
                });
                if (searchText !== undefined) {
                    todoProvider.setSearchFilter(searchText);
                }
            }],
        ['todoify.clearSearch', () => {
                todoProvider.setSearchFilter('');
            }],
        ['todoify.exportTodos', async () => {
                const format = await vscode.window.showQuickPick(['JSON', 'Markdown', 'CSV'], { placeHolder: 'Select export format' });
                if (!format) {
                    return;
                }
                const todos = todoProvider.getAllTodos();
                let content = '';
                switch (format) {
                    case 'JSON':
                        content = JSON.stringify(todos, null, 2);
                        break;
                    case 'Markdown':
                        content = todos.map(todo => {
                            const status = todo.completed ? '✓' : '☐';
                            const priority = { HIGH: '🔴', MEDIUM: '🟡', LOW: '🟢' }[todo.priority];
                            const dueDate = todo.dueDate ? `📅 ${todo.dueDate.toLocaleDateString('en-US')}` : '';
                            const tags = todo.tags.length ? `🏷️ ${todo.tags.join(', ')}` : '';
                            let md = `## ${status} ${priority} ${todo.text}\n\n`;
                            if (todo.category) {
                                md += `**Category:** ${todo.category}\n`;
                            }
                            if (dueDate) {
                                md += `**Due Date:** ${dueDate}\n`;
                            }
                            if (tags) {
                                md += `**Tags:** ${tags}\n`;
                            }
                            if (todo.notes) {
                                md += `\n${todo.notes}\n`;
                            }
                            if (todo.subtasks.length) {
                                md += '\n### Subtasks\n\n';
                                todo.subtasks.forEach(st => {
                                    md += `- [${st.completed ? 'x' : ' '}] ${st.text}\n`;
                                });
                            }
                            return md + '\n---\n';
                        }).join('\n');
                        break;
                    case 'CSV':
                        const headers = ['Status', 'Priority', 'Text', 'Category', 'Due Date', 'Tags', 'Notes'];
                        content = [headers.join(',')].concat(todos.map(todo => [
                            todo.completed ? 'Completed' : 'Pending',
                            todo.priority,
                            `"${todo.text.replace(/"/g, '""')}"`,
                            todo.category || '',
                            todo.dueDate ? todo.dueDate.toLocaleDateString('en-US') : '',
                            `"${todo.tags.join(', ')}"`,
                            `"${(todo.notes || '').replace(/"/g, '""')}"`
                        ].join(','))).join('\n');
                        break;
                }
                const uri = await vscode.window.showSaveDialog({
                    filters: {
                        [format.toLowerCase()]: [format.toLowerCase()]
                    },
                    saveLabel: 'Export'
                });
                if (uri) {
                    try {
                        await vscode.workspace.fs.writeFile(uri, Buffer.from(content, 'utf-8'));
                        vscode.window.showInformationMessage('Todos exported successfully!');
                    }
                    catch (error) {
                        vscode.window.showErrorMessage('Error exporting todos');
                    }
                }
            }],
        ['todoify.deleteTodo', async (item) => {
                if (!item) {
                    return;
                }
                const result = await vscode.window.showWarningMessage(`"${item.text}" will be deleted. Are you sure?`, { modal: true }, 'Delete', 'Cancel');
                if (result === 'Delete') {
                    todoProvider.deleteTodo(item);
                    vscode.window.showInformationMessage('Todo deleted successfully');
                }
            }],
        ['todoify.duplicateTodo', async (item) => {
                if (!item) {
                    return;
                }
                try {
                    const document = await vscode.workspace.openTextDocument(item.file);
                    const edit = new vscode.WorkspaceEdit();
                    const line = document.lineAt(item.line - 1);
                    const lineText = line.text;
                    const todoMatch = getKeywordMatch(lineText);
                    if (!todoMatch) {
                        throw new Error('Invalid todo format');
                    }
                    edit.insert(document.uri, new vscode.Position(item.line, 0), '\n' + lineText);
                    const success = await vscode.workspace.applyEdit(edit);
                    if (success) {
                        await document.save();
                        const text = document.getText();
                        const lines = text.split('\n');
                        const newTodos = lines.map((line, index) => {
                            try {
                                const match = getKeywordMatch(line);
                                if (!match)
                                    return null;
                                return {
                                    id: generateId(),
                                    text: match.text,
                                    file: document.uri.fsPath,
                                    line: index + 1,
                                    completed: false,
                                    priority: detectPriority(match.text),
                                    type: match.type,
                                    created: new Date(),
                                    lastModified: new Date(),
                                    tags: match.tags || [],
                                    category: match.category,
                                    subtasks: [],
                                    notes: match.notes || ''
                                };
                            }
                            catch (error) {
                                console.error(`Error processing line: ${index + 1}`, error);
                                return null;
                            }
                        }).filter((todo) => todo !== null);
                        const currentTodos = todoProvider.getAllTodos();
                        currentTodos
                            .filter(t => t.file === document.uri.fsPath)
                            .forEach(t => todoProvider.deleteTodo(t));
                        newTodos.forEach(todo => todoProvider.addTodo(todo));
                        vscode.window.showInformationMessage('Todo duplicated successfully');
                    }
                    else {
                        throw new Error('Failed to apply edit');
                    }
                }
                catch (error) {
                    console.error('Error duplicating todo:', error);
                    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                    vscode.window.showErrorMessage(`Error duplicating todo: ${errorMessage}`);
                }
            }],
        ['todoify.toggleTodo', (item) => { if (!item) {
                return;
            } todoProvider.toggleTodo(item); }],
        ['todoify.openTodo', async (item) => {
                if (!item) {
                    vscode.window.showErrorMessage('Please select a todo');
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
            }],
        ['todoify.addSubtask', async (item) => {
                if (!item) {
                    return;
                }
                const subtaskText = await vscode.window.showInputBox({ prompt: "Enter subtask text:" });
                if (!subtaskText) {
                    return;
                }
                const subtask = {
                    id: generateId(),
                    text: subtaskText,
                    completed: false,
                    created: new Date(),
                    lastModified: new Date()
                };
                item.subtasks.push(subtask);
                todoProvider.updateTodo(item);
            }],
        ['todoify.setDueDate', async (item) => {
                if (!item) {
                    return;
                }
                const dueDate = await vscode.window.showInputBox({
                    prompt: "Enter due date (YYYY-MM-DD):",
                    validateInput: (value) => {
                        if (!value) {
                            return null;
                        }
                        return isNaN(Date.parse(value)) ? "Invalid date" : null;
                    }
                });
                if (dueDate) {
                    item.dueDate = new Date(dueDate);
                    todoProvider.updateTodo(item);
                }
            }],
        ['todoify.addTags', async (item) => {
                if (!item) {
                    return;
                }
                const tags = await vscode.window.showInputBox({
                    prompt: "Enter tags (comma separated):",
                    value: item.tags.join(', ')
                });
                if (tags !== undefined) {
                    item.tags = tags.split(',').map(t => t.trim()).filter(t => t);
                    todoProvider.updateTodo(item);
                }
            }],
        ['todoify.setReminder', async (item) => {
                if (!item) {
                    return;
                }
                const reminder = await vscode.window.showInputBox({
                    prompt: "Enter reminder date and time (YYYY-MM-DD HH:mm):",
                    validateInput: (value) => {
                        if (!value) {
                            return null;
                        }
                        return isNaN(Date.parse(value)) ? "Invalid date and time" : null;
                    }
                });
                if (reminder) {
                    item.reminder = new Date(reminder);
                    todoProvider.updateTodo(item);
                    scheduleReminder(item);
                }
            }],
        ['todoify.addNotes', async (item) => {
                if (!item) {
                    return;
                }
                const notes = await vscode.window.showInputBox({
                    prompt: "Enter notes:",
                    value: item.notes
                });
                if (notes !== undefined) {
                    item.notes = notes;
                    todoProvider.updateTodo(item);
                }
            }],
        ['todoify.changePriority', async (item) => {
                if (!item) {
                    return;
                }
                const priority = await vscode.window.showQuickPick(['HIGH', 'MEDIUM', 'LOW'], { placeHolder: 'Select priority' });
                if (priority) {
                    item.priority = priority;
                    todoProvider.updateTodo(item);
                }
            }],
        ['todoify.sortBy', async () => {
                const option = await vscode.window.showQuickPick(['priority', 'dueDate', 'created', 'category', 'lastModified'], { placeHolder: 'Select sort option' });
                if (option) {
                    todoProvider.setSortOption(option);
                }
            }],
        ['todoify.editText', async (item) => {
                if (!item) {
                    return;
                }
                await todoProvider.startInlineEdit(item, 'text');
            }],
        ['todoify.editNotes', async (item) => {
                if (!item) {
                    return;
                }
                await todoProvider.startInlineEdit(item, 'notes');
            }],
        ['todoify.editTags', async (item) => {
                if (!item) {
                    return;
                }
                await todoProvider.startInlineEdit(item, 'tags');
            }],
    ];
    context.subscriptions.push(...commands.map(([command, callback]) => vscode.commands.registerCommand(command, callback)));
    vscode.workspace.onDidSaveTextDocument(() => {
        findTodosInWorkspace(todoProvider);
    });
    setInterval(() => checkReminders(todoProvider), 60000);
    findTodosInWorkspace(todoProvider);
}
function deactivate() { }
//# sourceMappingURL=extension.js.map