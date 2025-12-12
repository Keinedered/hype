import express from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { db } from '../db/init';

const router = express.Router();

// Get all lessons for a course
router.get('/course/:courseId', (req, res) => {
  const { courseId } = req.params;
  db.all(`
    SELECT l.*, m.title as module_title
    FROM lessons l
    LEFT JOIN modules m ON l.module_id = m.id
    WHERE l.course_id = ?
    ORDER BY l.module_id, l.order_index
  `, [courseId], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(rows);
  });
});

// Get lesson by ID
router.get('/:id', (req, res) => {
  const { id } = req.params;
  db.get(`
    SELECT l.*, m.title as module_title
    FROM lessons l
    LEFT JOIN modules m ON l.module_id = m.id
    WHERE l.id = ?
  `, [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!row) {
      return res.status(404).json({ error: 'Lesson not found' });
    }
    // Get handbook excerpts
    db.all(
      'SELECT * FROM lesson_handbook_excerpts WHERE lesson_id = ?',
      [id],
      (err2, excerpts) => {
        if (!err2) {
          (row as any).handbookExcerpts = excerpts;
        }
        res.json(row);
      }
    );
  });
});

// Create lesson (admin only)
router.post('/', authenticate, (req: AuthRequest, res) => {
  if (req.userRole !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const {
    title,
    description,
    moduleId,
    courseId,
    order,
    videoUrl,
    videoDuration,
    transcript,
    assignmentId
  } = req.body;

  db.run(
    `INSERT INTO lessons (
      title, description, module_id, course_id, order_index,
      video_url, video_duration, transcript, assignment_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [title, description, moduleId, courseId, order, videoUrl, videoDuration, transcript, assignmentId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to create lesson' });
      }
      res.status(201).json({ id: this.lastID, ...req.body });
    }
  );
});

// Update lesson (admin only)
router.put('/:id', authenticate, (req: AuthRequest, res) => {
  if (req.userRole !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const { id } = req.params;
  const {
    title,
    description,
    moduleId,
    order,
    videoUrl,
    videoDuration,
    transcript,
    assignmentId
  } = req.body;

  db.run(
    `UPDATE lessons SET
      title = ?, description = ?, module_id = ?, order_index = ?,
      video_url = ?, video_duration = ?, transcript = ?, assignment_id = ?
    WHERE id = ?`,
    [title, description, moduleId, order, videoUrl, videoDuration, transcript, assignmentId, id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to update lesson' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Lesson not found' });
      }
      res.json({ id, ...req.body });
    }
  );
});

// Delete lesson (admin only)
router.delete('/:id', authenticate, (req: AuthRequest, res) => {
  if (req.userRole !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const { id } = req.params;
  db.run('DELETE FROM lessons WHERE id = ?', [id], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Failed to delete lesson' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Lesson not found' });
    }
    res.json({ message: 'Lesson deleted' });
  });
});

export default router;
