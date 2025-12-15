import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import companyRoutes from './routes/companyRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

import chatRoutes from './routes/chatRoutes';
import path from 'path';

// Routes
app.use('/auth', authRoutes);
app.use('/company', companyRoutes);
app.use('/chat', chatRoutes);

// Serve widget static file
app.use(express.static(path.join(__dirname, '../public')));

// Health check and Root route
app.get('/', (req, res) => {
    res.json({ status: 'ok', service: 'backend-node', uptime: process.uptime() });
});

app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'backend-node' });
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
