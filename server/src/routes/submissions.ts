import express from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { db } from '../db/init';

const router = express.Router();

// Get user's submissions
router.get('/my', authenticate, (req: AuthRequest, res) => {
  db.all(`
    SELECT s.*, a.title as assignment_title, l.title as lesson_title, c.title as course_title
    FROM submissions s
    LEFT JOIN assignments a ON s.assignment_id = a.id
    LEFT JOIN lessons l ON a.lesson_id = l.id
    LEFT JOIN courses c ON l.course_id = c.id
    WHERE s.user_id = ?
    ORDER BY s.submitted_at DESC
  `, [req.userId], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(rows);
  });
});

// Get submissions for assignment (curator/admin)
router.get('/assignment/:assignmentId', authenticate, (req: AuthRequest, res) => {
  if (req.userRole !== 'admin' && req.userRole !== 'curator') {
    return res.status(403).json({ error: 'Access denied' });
  }

  const { assignmentId } = req.params;
  db.all(`
    SELECT s.*, u.name as user_name, u.email as user_email
    FROM submissions s
    LEFT JOIN users u ON s.user_id = u.id
    WHERE s.assignment_id = ?
    ORDER BY s.submitted_at DESC
  `, [assignmentId], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(rows);
  });
});

// Submit assignment
router.post('/', authenticate, (req: AuthRequest, res) => {
  const { assignmentId, textAnswer, linkUrl, fileUrls } = req.body;

  // Get latest version
  db.get(
    'SELECT MAX(version) as maxVersion FROM submissions WHERE assignment_id = ? AND user_id = ?',
    [assignmentId, req.userId],
    (err, row: any) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      const version = (row?.maxVersion || 0) + 1;

      db.run(
        `INSERT INTO submissions (
          assignment_id, user_id, version, text_answer, link_url, file_urls, status
        ) VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
        [assignmentId, req.userId, version, textAnswer, linkUrl, JSON.stringify(fileUrls || [])],
        function(err2) {
          if (err2) {
            return res.status(500).json({ error: 'Failed to submit assignment' });
          }

          // Create notification for curators
          db.run(
            `INSERT INTO notifications (user_id, type, title, message, related_entity_id, related_entity_type)
             SELECT id, 'submission-status-changed', 'Новое задание на проверке', 
                    'Получено новое решение задания', ?, 'submission'
             FROM users WHERE role IN ('curator', 'admin')`,
            [this.lastID]
          );

          res.status(201).json({ id: this.lastID, message: 'Assignment submitted' });
        }
      );
    }
  );
});

// Review submission (curator/admin)
router.put('/:id/review', authenticate, (req: AuthRequest, res) => {
  if (req.userRole !== 'admin' && req.userRole !== 'curator') {
    return res.status(403).json({ error: 'Access denied' });
  }

  const { id } = req.params;
  const { status, curatorComment } = req.body;

  db.run(
    `UPDATE submissions SET
      status = ?, curator_comment = ?, curator_id = ?, reviewed_at = CURRENT_TIMESTAMP
    WHERE id = ?`,
    [status, curatorComment, req.userId, id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to review submission' });
      }

      // Get submission to create notification
      db.get('SELECT user_id FROM submissions WHERE id = ?', [id], (err2, submission: any) => {
        if (!err2 && submission) {
          db.run(
            `INSERT INTO notifications (user_id, type, title, message, related_entity_id, related_entity_type)
             VALUES (?, 'submission-status-changed', 'Статус задания изменен',
                     ?, ?, 'submission')`,
            [submission.user_id, `Ваше задание получило статус: ${status}`, id]
          );
        }
      });

      res.json({ message: 'Submission reviewed' });
    }
  );
});

export default router;
