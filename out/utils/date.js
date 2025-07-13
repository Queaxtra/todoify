"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateDateInput = validateDateInput;
function validateDateInput(value) {
    if (!value || !value.trim())
        return null;
    const trimmedValue = value.trim();
    const dateFormats = [
        /^(\d{4})-(\d{1,2})-(\d{1,2})$/,
        /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,
        /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/,
        /^(\d{4})\/(\d{1,2})\/(\d{1,2})$/,
    ];
    for (const format of dateFormats) {
        const match = trimmedValue.match(format);
        if (match) {
            let year, month, day;
            if (format === dateFormats[0] || format === dateFormats[3]) {
                year = parseInt(match[1]);
                month = parseInt(match[2]) - 1;
                day = parseInt(match[3]);
            }
            else {
                month = parseInt(match[1]) - 1;
                day = parseInt(match[2]);
                year = parseInt(match[3]);
            }
            if (year < 1000 || year > 9999)
                continue;
            if (month < 0 || month > 11)
                continue;
            if (day < 1 || day > 31)
                continue;
            const date = new Date(year, month, day);
            if (date.getFullYear() === year &&
                date.getMonth() === month &&
                date.getDate() === day) {
                return date;
            }
        }
    }
    const naturalDate = new Date(trimmedValue);
    if (!isNaN(naturalDate.getTime())) {
        return naturalDate;
    }
    return null;
}
//# sourceMappingURL=date.js.map