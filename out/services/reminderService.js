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
exports.ReminderService = void 0;
const vscode = __importStar(require("vscode"));
class ReminderService {
    static instance;
    activeReminders = new Map();
    provider;
    constructor() { }
    static getInstance() {
        if (!ReminderService.instance) {
            ReminderService.instance = new ReminderService();
        }
        return ReminderService.instance;
    }
    setProvider(provider) {
        this.provider = provider;
    }
    scheduleReminder(todo) {
        if (!todo.reminder)
            return;
        this.clearReminder(todo.id);
        const now = new Date();
        const delay = todo.reminder.getTime() - now.getTime();
        if (delay <= 0)
            return;
        const timeout = setTimeout(() => {
            this.showReminderNotification(todo);
        }, delay);
        this.activeReminders.set(todo.id, timeout);
    }
    clearReminder(todoId) {
        const timeout = this.activeReminders.get(todoId);
        if (timeout) {
            clearTimeout(timeout);
            this.activeReminders.delete(todoId);
        }
    }
    clearAllReminders() {
        this.activeReminders.forEach((timeout) => clearTimeout(timeout));
        this.activeReminders.clear();
    }
    checkDueReminders(todos) {
        const now = new Date();
        todos.forEach((todo) => {
            if (todo.reminder &&
                todo.reminder.getTime() <= now.getTime() &&
                !todo.completed) {
                this.showReminderNotification(todo);
            }
        });
    }
    showReminderNotification(todo) {
        vscode.window
            .showInformationMessage(`Reminder: ${todo.text}`, "OK", "Snooze", "Complete")
            .then((selection) => {
            switch (selection) {
                case "Snooze":
                    this.snoozeReminder(todo);
                    break;
                case "Complete":
                    this.completeReminderTodo(todo);
                    break;
                default:
                    this.dismissReminder(todo);
                    break;
            }
        });
    }
    snoozeReminder(todo) {
        todo.reminder = new Date(Date.now() + 30 * 60000);
        if (this.provider) {
            this.provider.updateTodo(todo);
        }
        this.scheduleReminder(todo);
    }
    completeReminderTodo(todo) {
        if (this.provider) {
            this.provider.toggleTodo(todo);
        }
        todo.reminder = undefined;
        this.clearReminder(todo.id);
    }
    dismissReminder(todo) {
        todo.reminder = undefined;
        if (this.provider) {
            this.provider.updateTodo(todo);
        }
        this.clearReminder(todo.id);
    }
    rescheduleAllReminders(todos) {
        this.clearAllReminders();
        todos.forEach((todo) => {
            if (todo.reminder && !todo.completed) {
                this.scheduleReminder(todo);
            }
        });
    }
    getActiveReminderCount() {
        return this.activeReminders.size;
    }
    hasActiveReminder(todoId) {
        return this.activeReminders.has(todoId);
    }
}
exports.ReminderService = ReminderService;
//# sourceMappingURL=reminderService.js.map