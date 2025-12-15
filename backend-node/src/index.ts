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

app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'backend-node' });
});

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

export default app;
