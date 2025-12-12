import express from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { db } from '../db/init';

const router = express.Router();

// Get all courses
router.get('/', (req, res) => {
  db.all(`
    SELECT c.*, t.title as track_title, t.color as track_color
    FROM courses c
    LEFT JOIN tracks t ON c.track_id = t.id
    ORDER BY c.id
  `, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(rows);
  });
});

// Get course by ID
router.get('/:id', (req, res) => {
  const { id } = req.params;
  db.get(`
    SELECT c.*, t.title as track_title, t.color as track_color
    FROM courses c
    LEFT JOIN tracks t ON c.track_id = t.id
    WHERE c.id = ?
  `, [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!row) {
      return res.status(404).json({ error: 'Course not found' });
    }
    res.json(row);
  });
});

// Create course (admin only)
router.post('/', authenticate, (req: AuthRequest, res) => {
  if (req.userRole !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const {
    title,
    description,
    extendedDescription,
    trackId,
    version,
    level,
    goals,
    targetAudience,
    results,
    authors,
    moduleCount,
    lessonCount
  } = req.body;

  db.run(
    `INSERT INTO courses (
      title, description, extended_description, track_id, version, level,
      goals, target_audience, results, authors, module_count, lesson_count
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      title, description, extendedDescription, trackId, version || 'v1.0',
      level || 'beginner', JSON.stringify(goals || []), targetAudience,
      JSON.stringify(results || []), JSON.stringify(authors || []),
      moduleCount || 0, lessonCount || 0
    ],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to create course' });
      }
      res.status(201).json({ id: this.lastID, ...req.body });
    }
  );
});

// Update course (admin only)
router.put('/:id', authenticate, (req: AuthRequest, res) => {
  if (req.userRole !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const { id } = req.params;
  const {
    title,
    description,
    extendedDescription,
    trackId,
    version,
    level,
    goals,
    targetAudience,
    results,
    authors,
    moduleCount,
    lessonCount
  } = req.body;

  db.run(
    `UPDATE courses SET
      title = ?, description = ?, extended_description = ?, track_id = ?,
      version = ?, level = ?, goals = ?, target_audience = ?, results = ?,
      authors = ?, module_count = ?, lesson_count = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?`,
    [
      title, description, extendedDescription, trackId, version, level,
      JSON.stringify(goals || []), targetAudience, JSON.stringify(results || []),
      JSON.stringify(authors || []), moduleCount, lessonCount, id
    ],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to update course' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Course not found' });
      }
      res.json({ id, ...req.body });
    }
  );
});

// Delete course (admin only)
router.delete('/:id', authenticate, (req: AuthRequest, res) => {
  if (req.userRole !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const { id } = req.params;
  db.run('DELETE FROM courses WHERE id = ?', [id], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Failed to delete course' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }
    res.json({ message: 'Course deleted' });
  });
});

export default router;
