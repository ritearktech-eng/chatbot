import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import companyRoutes from './routes/companyRoutes';
import prisma from './utils/prisma';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Request Logging Middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    console.log('Headers:', JSON.stringify(req.headers));
    if (req.body) console.log('Body:', JSON.stringify(req.body));
    next();
});

import * as companyController from './controllers/companyController';
import * as analyticsController from './controllers/analyticsController';
import * as authController from './controllers/authController';
import * as userController from './controllers/userController';
import { authenticate as authMiddleware } from './middleware/authMiddleware';

import chatRoutes from './routes/chatRoutes';
import path from 'path';

// Routes
app.post('/auth/register', authController.register);
app.post('/auth/login', authController.login);

app.post('/auth/login', authController.login);

app.use('/company', companyRoutes);

app.patch('/super-admin/company/:id/status', authMiddleware, companyController.updateCompanyStatus);
// New Analytics Routes
app.post('/company/:companyId/message', analyticsController.incrementMessageCount);
app.get('/super-admin/stats', authMiddleware, analyticsController.getDashboardStats);
// User Management Routes
app.get('/super-admin/users', authMiddleware, userController.getAllUsers);
app.get('/super-admin/users/:id', authMiddleware, userController.getUserDetails);
app.get('/super-admin/company/:id/full', authMiddleware, companyController.getCompanyFullDetails);

app.use('/chat', chatRoutes);

// Serve widget static file
app.use(express.static(path.join(__dirname, '../public')));

// Health check and Root route
app.get('/', (req, res) => {
    res.json({ status: 'ok', service: 'backend-node', uptime: process.uptime() });
});

app.get('/health', async (req, res) => {
    try {
        await prisma.$queryRaw`SELECT 1`;
        res.json({ status: 'ok', service: 'backend-node', database: 'connected' });
    } catch (error) {
        console.error('Health check failed:', error);
        res.status(500).json({ status: 'error', service: 'backend-node', database: 'disconnected', error: error });
    }
});

if (require.main === module) {
    const server = app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
        console.log(`Initial memory usage: ${JSON.stringify(process.memoryUsage())}`);
    });

    // Graceful shutdown
    const shutdown = (signal: string) => {
        console.log(`Received ${signal}. Shutting down gracefully...`);
        server.close(() => {
            console.log('Server closed.');
            process.exit(0);
        });

        // Force close after 10s
        setTimeout(() => {
            console.error('Could not close connections in time, forcefully shutting down');
            process.exit(1);
        }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
}

export default app;
