"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateId = generateId;
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}
//# sourceMappingURL=id.js.map