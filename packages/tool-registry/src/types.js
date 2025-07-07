"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ToolExecutionError = void 0;
/**
 * Custom error class for tool execution failures.
 */
class ToolExecutionError extends Error {
    constructor(message, options) {
        super(message);
        this.name = 'ToolExecutionError';
        this.cause = options?.cause;
        this.toolName = options?.toolName;
        this.input = options?.input;
        Object.setPrototypeOf(this, ToolExecutionError.prototype);
    }
}
exports.ToolExecutionError = ToolExecutionError;
//# sourceMappingURL=types.js.map