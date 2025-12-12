import sqlite3 from 'sqlite3';
import path from 'path';

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../../database.sqlite');

export const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log('Connected to SQLite database');
  }
});

export function initDatabase(): Promise<void> {
  return new Promise((resolve, reject) => {
    let completed = 0;
    const totalTables = 12; // Количество таблиц
    
    const checkComplete = () => {
      completed++;
      if (completed === totalTables) {
        console.log('Database tables initialized');
        resolve();
      }
    };

    // Users table
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'student',
        avatar_url TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) reject(err);
      else checkComplete();
    });

    // Tracks table
    db.run(`
      CREATE TABLE IF NOT EXISTS tracks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        color TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) reject(err);
      else checkComplete();
    });

    // Courses table
    db.run(`
      CREATE TABLE IF NOT EXISTS courses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        extended_description TEXT,
        track_id INTEGER NOT NULL,
        version TEXT DEFAULT 'v1.0',
        level TEXT DEFAULT 'beginner',
        goals TEXT,
        target_audience TEXT,
        results TEXT,
        authors TEXT,
        module_count INTEGER DEFAULT 0,
        lesson_count INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (track_id) REFERENCES tracks(id)
      )
    `, (err) => {
      if (err) reject(err);
      else checkComplete();
    });

    // Modules table
    db.run(`
      CREATE TABLE IF NOT EXISTS modules (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        course_id INTEGER NOT NULL,
        order_index INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (course_id) REFERENCES courses(id)
      )
    `, (err) => {
      if (err) reject(err);
      else checkComplete();
    });

    // Lessons table
    db.run(`
      CREATE TABLE IF NOT EXISTS lessons (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        module_id INTEGER NOT NULL,
        course_id INTEGER NOT NULL,
        order_index INTEGER NOT NULL,
        video_url TEXT,
        video_duration INTEGER,
        transcript TEXT,
        assignment_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (module_id) REFERENCES modules(id),
        FOREIGN KEY (course_id) REFERENCES courses(id)
      )
    `, (err) => {
      if (err) reject(err);
      else checkComplete();
    });

    // Graph nodes table
    db.run(`
      CREATE TABLE IF NOT EXISTS graph_nodes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        entity_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        x REAL,
        y REAL,
        size REAL DEFAULT 1,
        color TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) reject(err);
      else checkComplete();
    });

    // Graph edges table
    db.run(`
      CREATE TABLE IF NOT EXISTS graph_edges (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        source_node_id INTEGER NOT NULL,
        target_node_id INTEGER NOT NULL,
        type TEXT NOT NULL DEFAULT 'recommended',
        condition TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (source_node_id) REFERENCES graph_nodes(id),
        FOREIGN KEY (target_node_id) REFERENCES graph_nodes(id)
      )
    `, (err) => {
      if (err) reject(err);
      else checkComplete();
    });

    // User progress table
    db.run(`
      CREATE TABLE IF NOT EXISTS user_progress (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        node_id INTEGER NOT NULL,
        status TEXT NOT NULL DEFAULT 'not-started',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (node_id) REFERENCES graph_nodes(id),
        UNIQUE(user_id, node_id)
      )
    `, (err) => {
      if (err) reject(err);
      else checkComplete();
    });

    // Assignments table
    db.run(`
      CREATE TABLE IF NOT EXISTS assignments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        lesson_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        criteria TEXT,
        accepts_text INTEGER DEFAULT 1,
        accepts_file INTEGER DEFAULT 0,
        accepts_link INTEGER DEFAULT 0,
        allowed_file_types TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (lesson_id) REFERENCES lessons(id)
      )
    `, (err) => {
      if (err) reject(err);
      else checkComplete();
    });

    // Submissions table
    db.run(`
      CREATE TABLE IF NOT EXISTS submissions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        assignment_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        version INTEGER DEFAULT 1,
        text_answer TEXT,
        file_urls TEXT,
        link_url TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        curator_comment TEXT,
        curator_id INTEGER,
        submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        reviewed_at DATETIME,
        FOREIGN KEY (assignment_id) REFERENCES assignments(id),
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (curator_id) REFERENCES users(id)
      )
    `, (err) => {
      if (err) reject(err);
      else checkComplete();
    });

    // Handbook sections table
    db.run(`
      CREATE TABLE IF NOT EXISTS handbook_sections (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        handbook_id INTEGER NOT NULL,
        track_id INTEGER,
        course_id INTEGER,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        order_index INTEGER NOT NULL,
        anchor TEXT,
        parent_section_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (parent_section_id) REFERENCES handbook_sections(id)
      )
    `, (err) => {
      if (err) reject(err);
      else checkComplete();
    });

    // Lesson handbook excerpts table
    db.run(`
      CREATE TABLE IF NOT EXISTS lesson_handbook_excerpts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        lesson_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        text TEXT NOT NULL,
        handbook_section_id INTEGER NOT NULL,
        FOREIGN KEY (lesson_id) REFERENCES lessons(id),
        FOREIGN KEY (handbook_section_id) REFERENCES handbook_sections(id)
      )
    `, (err) => {
      if (err) reject(err);
      else checkComplete();
    });

    // Notifications table
    db.run(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        is_read INTEGER DEFAULT 0,
        related_entity_id INTEGER,
        related_entity_type TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `, (err) => {
      if (err) reject(err);
      else checkComplete();
    });
  });
}
