"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables
dotenv_1.default.config({ path: '../../.env' });
// Manually resolve DATABASE_URL since dotenv doesn't support variable substitution
if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('${')) {
    const { POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_HOST_PORT, POSTGRES_DB_NAME } = process.env;
    if (POSTGRES_USER && POSTGRES_PASSWORD && POSTGRES_HOST_PORT && POSTGRES_DB_NAME) {
        process.env.DATABASE_URL = `postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@localhost:${POSTGRES_HOST_PORT}/${POSTGRES_DB_NAME}`;
        console.log('DATABASE_URL resolved:', process.env.DATABASE_URL);
    }
    else {
        console.error('Missing PostgreSQL environment variables');
    }
}
// Import routes (to be created)
const auth_routes_1 = require("./routes/auth.routes");
const card_routes_1 = require("./routes/card.routes");
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const chat_routes_1 = __importDefault(require("./routes/chat.routes"));
const app = (0, express_1.default)();
// Middleware
app.use((0, cors_1.default)()); // Enable CORS for all routes
app.use(express_1.default.json()); // Parse JSON request bodies
app.use(express_1.default.urlencoded({ extended: true })); // Parse URL-encoded request bodies
// Basic Health Check Route
app.get('/api/health', (req, res) => {
    res.status(200).json({ message: 'API is running' });
});
// API Routes - Implements Directive 2: User growth profile endpoints
app.use('/api/auth', auth_routes_1.authRoutes);
app.use('/api/cards', card_routes_1.cardRoutes);
app.use('/api/users', user_routes_1.default);
app.use('/api/chat', chat_routes_1.default);
// Global Error Handler (simple example)
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err.stack);
    // Avoid sending stack trace to client in production
    res.status(500).json({
        message: 'Internal Server Error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
});
// Handle 404 Not Found
app.use((req, res) => {
    res.status(404).json({ message: 'Not Found' });
});
exports.default = app;
//# sourceMappingURL=app.js.map