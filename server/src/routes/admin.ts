import express from 'express';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';
import { db } from '../db/init';

const router = express.Router();

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(requireAdmin);

// Get all pending submissions
router.get('/submissions/pending', (req, res) => {
  db.all(`
    SELECT s.*, u.name as user_name, u.email as user_email,
           a.title as assignment_title, l.title as lesson_title, c.title as course_title
    FROM submissions s
    LEFT JOIN users u ON s.user_id = u.id
    LEFT JOIN assignments a ON s.assignment_id = a.id
    LEFT JOIN lessons l ON a.lesson_id = l.id
    LEFT JOIN courses c ON l.course_id = c.id
    WHERE s.status = 'pending'
    ORDER BY s.submitted_at ASC
  `, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(rows);
  });
});

// Get dashboard stats
router.get('/dashboard/stats', (req, res) => {
  const stats: any = {};

  // Count users
  db.get('SELECT COUNT(*) as count FROM users', [], (err, row: any) => {
    if (!err) stats.totalUsers = row.count;

    // Count courses
    db.get('SELECT COUNT(*) as count FROM courses', [], (err2, row2: any) => {
      if (!err2) stats.totalCourses = row2.count;

      // Count pending submissions
      db.get("SELECT COUNT(*) as count FROM submissions WHERE status = 'pending'", [], (err3, row3: any) => {
        if (!err3) stats.pendingSubmissions = row3.count;

        // Count active students
        db.get("SELECT COUNT(DISTINCT user_id) as count FROM user_progress", [], (err4, row4: any) => {
          if (!err4) stats.activeStudents = row4.count;
          res.json(stats);
        });
      });
    });
  });
});

export default router;
