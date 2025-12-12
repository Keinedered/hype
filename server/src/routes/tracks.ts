import express from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { db } from '../db/init';

const router = express.Router();

// Get all tracks
router.get('/', (req, res) => {
  db.all('SELECT * FROM tracks ORDER BY id', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(rows);
  });
});

// Get track by ID
router.get('/:id', (req, res) => {
  const { id } = req.params;
  db.get('SELECT * FROM tracks WHERE id = ?', [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!row) {
      return res.status(404).json({ error: 'Track not found' });
    }
    res.json(row);
  });
});

// Create track (admin only)
router.post('/', authenticate, (req: AuthRequest, res) => {
  if (req.userRole !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const { title, description, color } = req.body;
  db.run(
    'INSERT INTO tracks (title, description, color) VALUES (?, ?, ?)',
    [title, description, color],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to create track' });
      }
      res.status(201).json({ id: this.lastID, title, description, color });
    }
  );
});

// Update track (admin only)
router.put('/:id', authenticate, (req: AuthRequest, res) => {
  if (req.userRole !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const { id } = req.params;
  const { title, description, color } = req.body;
  db.run(
    'UPDATE tracks SET title = ?, description = ?, color = ? WHERE id = ?',
    [title, description, color, id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to update track' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Track not found' });
      }
      res.json({ id, title, description, color });
    }
  );
});

// Delete track (admin only)
router.delete('/:id', authenticate, (req: AuthRequest, res) => {
  if (req.userRole !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const { id } = req.params;
  db.run('DELETE FROM tracks WHERE id = ?', [id], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Failed to delete track' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Track not found' });
    }
    res.json({ message: 'Track deleted' });
  });
});

export default router;
