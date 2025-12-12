import express from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { db } from '../db/init';

const router = express.Router();

// Get assignment by lesson ID
router.get('/lesson/:lessonId', (req, res) => {
  const { lessonId } = req.params;
  db.get('SELECT * FROM assignments WHERE lesson_id = ?', [lessonId], (err, row) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!row) {
      return res.status(404).json({ error: 'Assignment not found' });
    }
    res.json(row);
  });
});

// Create assignment (admin only)
router.post('/', authenticate, (req: AuthRequest, res) => {
  if (req.userRole !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const {
    lessonId,
    title,
    description,
    criteria,
    acceptsText,
    acceptsFile,
    acceptsLink,
    allowedFileTypes
  } = req.body;

  db.run(
    `INSERT INTO assignments (
      lesson_id, title, description, criteria,
      accepts_text, accepts_file, accepts_link, allowed_file_types
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      lessonId, title, description, criteria,
      acceptsText ? 1 : 0, acceptsFile ? 1 : 0, acceptsLink ? 1 : 0,
      JSON.stringify(allowedFileTypes || [])
    ],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to create assignment' });
      }
      res.status(201).json({ id: this.lastID, ...req.body });
    }
  );
});

// Update assignment (admin only)
router.put('/:id', authenticate, (req: AuthRequest, res) => {
  if (req.userRole !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const { id } = req.params;
  const {
    title,
    description,
    criteria,
    acceptsText,
    acceptsFile,
    acceptsLink,
    allowedFileTypes
  } = req.body;

  db.run(
    `UPDATE assignments SET
      title = ?, description = ?, criteria = ?,
      accepts_text = ?, accepts_file = ?, accepts_link = ?, allowed_file_types = ?
    WHERE id = ?`,
    [
      title, description, criteria,
      acceptsText ? 1 : 0, acceptsFile ? 1 : 0, acceptsLink ? 1 : 0,
      JSON.stringify(allowedFileTypes || []), id
    ],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to update assignment' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Assignment not found' });
      }
      res.json({ id, ...req.body });
    }
  );
});

export default router;
