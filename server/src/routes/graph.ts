import express from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { db } from '../db/init';

const router = express.Router();

// Get graph nodes for course
router.get('/course/:courseId', authenticate, (req: AuthRequest, res) => {
  const { courseId } = req.params;
  const userId = req.userId || null;

  db.all(`
    SELECT gn.*,
           COALESCE(up.status, 'not-started') as user_status
    FROM graph_nodes gn
    LEFT JOIN user_progress up ON gn.id = up.node_id AND up.user_id = ?
    WHERE gn.entity_id IN (
      SELECT id FROM lessons WHERE course_id = ?
    )
    ORDER BY gn.id
  `, [userId, courseId], (err, nodes) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    // Get edges
    db.all(`
      SELECT ge.*
      FROM graph_edges ge
      WHERE ge.source_node_id IN (
        SELECT id FROM graph_nodes WHERE entity_id IN (
          SELECT id FROM lessons WHERE course_id = ?
        )
      )
    `, [courseId], (err2, edges) => {
      if (err2) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({ nodes, edges });
    });
  });
});

// Update user progress
router.post('/progress', authenticate, (req: AuthRequest, res) => {
  const { nodeId, status } = req.body;

  db.run(
    `INSERT OR REPLACE INTO user_progress (user_id, node_id, status, updated_at)
     VALUES (?, ?, ?, CURRENT_TIMESTAMP)`,
    [req.userId, nodeId, status],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to update progress' });
      }
      res.json({ message: 'Progress updated' });
    }
  );
});

// Create/update graph node (admin only)
router.post('/nodes', authenticate, (req: AuthRequest, res) => {
  if (req.userRole !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const { type, entityId, title, description, x, y, size, color } = req.body;

  db.run(
    `INSERT INTO graph_nodes (type, entity_id, title, description, x, y, size, color)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [type, entityId, title, description, x, y, size, color],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to create node' });
      }
      res.status(201).json({ id: this.lastID, ...req.body });
    }
  );
});

// Create/update graph edge (admin only)
router.post('/edges', authenticate, (req: AuthRequest, res) => {
  if (req.userRole !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const { sourceNodeId, targetNodeId, type, condition } = req.body;

  db.run(
    `INSERT INTO graph_edges (source_node_id, target_node_id, type, condition)
     VALUES (?, ?, ?, ?)`,
    [sourceNodeId, targetNodeId, type, condition],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to create edge' });
      }
      res.status(201).json({ id: this.lastID, ...req.body });
    }
  );
});

export default router;
