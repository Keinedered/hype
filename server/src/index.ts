import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import tracksRoutes from './routes/tracks';
import coursesRoutes from './routes/courses';
import modulesRoutes from './routes/modules';
import lessonsRoutes from './routes/lessons';
import assignmentsRoutes from './routes/assignments';
import submissionsRoutes from './routes/submissions';
import graphRoutes from './routes/graph';
import adminRoutes from './routes/admin';
import { initDatabase } from './db/init';
import { seedDatabase } from './db/seed';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize database and seed data
initDatabase()
  .then(() => {
    // Seed initial data (only in development)
    if (process.env.NODE_ENV !== 'production') {
      return seedDatabase();
    }
  })
  .catch((error) => {
    console.error('Error initializing database:', error);
  });

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tracks', tracksRoutes);
app.use('/api/courses', coursesRoutes);
app.use('/api/modules', modulesRoutes);
app.use('/api/lessons', lessonsRoutes);
app.use('/api/assignments', assignmentsRoutes);
app.use('/api/submissions', submissionsRoutes);
app.use('/api/graph', graphRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
