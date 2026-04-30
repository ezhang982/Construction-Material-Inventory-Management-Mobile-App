import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import authRoutes      from './routes/auth';
import jobsiteRoutes   from './routes/jobsites';
import payorderRoutes  from './routes/payorders';
import warehouseRoutes from './routes/warehouses';

dotenv.config();

const app  = express();
const PORT = process.env.PORT || 3000;

// middleware
app.use(cors());           // Allow requests from the React Native frontend
app.use(express.json());   // Parse JSON request bodies

// routes
app.use('/auth',       authRoutes);
app.use('/jobsites',   jobsiteRoutes);
app.use('/payorders',  payorderRoutes);
app.use('/warehouses', warehouseRoutes);

// health check
app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// start
app.listen(PORT, () => {
    console.log(`Backend running on http://localhost:${PORT}`);
});

export default app;