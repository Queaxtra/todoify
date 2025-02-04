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
exports.strikeThrough = exports.detectPriority = exports.getKeywordMatch = exports.scheduleReminder = exports.generateId = void 0;
const vscode = __importStar(require("vscode"));
const icons_1 = require("../constants/icons");
const generateId = () => {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
};
exports.generateId = generateId;
const scheduleReminder = (todo, updateTodo) => {
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
                updateTodo(todo);
                (0, exports.scheduleReminder)(todo, updateTodo);
            }
        });
    }, delay);
};
exports.scheduleReminder = scheduleReminder;
const getKeywordMatch = (line) => {
    try {
        for (const [keyword, type] of Object.entries(icons_1.TODO_KEYWORDS)) {
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
};
exports.getKeywordMatch = getKeywordMatch;
const detectPriority = (text) => {
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
};
exports.detectPriority = detectPriority;
const strikeThrough = (text) => {
    return text.split('').join('\u0336') + '\u0336';
};
exports.strikeThrough = strikeThrough;
//# sourceMappingURL=todoUtils.js.map