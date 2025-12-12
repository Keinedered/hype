import express from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { db } from '../db/init';

const router = express.Router();

// Get all modules for a course
router.get('/course/:courseId', (req, res) => {
  const { courseId } = req.params;
  db.all(
    'SELECT * FROM modules WHERE course_id = ? ORDER BY order_index',
    [courseId],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(rows);
    }
  );
});

// Get module by ID
router.get('/:id', (req, res) => {
  const { id } = req.params;
  db.get('SELECT * FROM modules WHERE id = ?', [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!row) {
      return res.status(404).json({ error: 'Module not found' });
    }
    res.json(row);
  });
});

// Create module (admin only)
router.post('/', authenticate, (req: AuthRequest, res) => {
  if (req.userRole !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const { title, description, courseId, order } = req.body;
  db.run(
    'INSERT INTO modules (title, description, course_id, order_index) VALUES (?, ?, ?, ?)',
    [title, description, courseId, order],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to create module' });
      }
      res.status(201).json({ id: this.lastID, title, description, courseId, order });
    }
  );
});

// Update module (admin only)
router.put('/:id', authenticate, (req: AuthRequest, res) => {
  if (req.userRole !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const { id } = req.params;
  const { title, description, order } = req.body;
  db.run(
    'UPDATE modules SET title = ?, description = ?, order_index = ? WHERE id = ?',
    [title, description, order, id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to update module' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Module not found' });
      }
      res.json({ id, title, description, order });
    }
  );
});

// Delete module (admin only)
router.delete('/:id', authenticate, (req: AuthRequest, res) => {
  if (req.userRole !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const { id } = req.params;
  db.run('DELETE FROM modules WHERE id = ?', [id], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Failed to delete module' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Module not found' });
    }
    res.json({ message: 'Module deleted' });
  });
});

export default router;
