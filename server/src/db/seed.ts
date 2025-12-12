import { db, initDatabase } from './init';
import bcrypt from 'bcryptjs';

// Helper to run SQL and handle errors
function runSQL(sql: string, params: any[] = []): Promise<void> {
  return new Promise((resolve, reject) => {
    db.run(sql, params, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

export async function seedDatabase() {
  try {
    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 10);
    await runSQL(
      'INSERT OR IGNORE INTO users (email, password, name, role) VALUES (?, ?, ?, ?)',
      ['admin@example.com', adminPassword, 'Администратор', 'admin']
    );
    console.log('Admin user created: admin@example.com / admin123');

    // Create test student
    const studentPassword = await bcrypt.hash('student123', 10);
    await runSQL(
      'INSERT OR IGNORE INTO users (email, password, name, role) VALUES (?, ?, ?, ?)',
      ['student@example.com', studentPassword, 'Студент', 'student']
    );
    console.log('Student user created: student@example.com / student123');

    // Seed tracks
    const tracks = [
      { title: 'Ивент', description: 'Организация и проведение мероприятий', color: '#FF6B35' },
      { title: 'Цифровые продукты', description: 'Создание и развитие цифровых продуктов', color: '#4A90E2' },
      { title: 'Внешка и деловая коммуникация', description: 'Эффективная коммуникация и внешние связи в бизнесе', color: '#9B59B6' },
      { title: 'Дизайн', description: 'Основы дизайна и визуальной коммуникации', color: '#2ECC71' }
    ];

    for (let index = 0; index < tracks.length; index++) {
      const track = tracks[index];
      await runSQL(
        'INSERT OR IGNORE INTO tracks (id, title, description, color) VALUES (?, ?, ?, ?)',
        [index + 1, track.title, track.description, track.color]
      );
    }

    console.log('Database seeded successfully');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
}

if (require.main === module) {
  seedDatabase().then(() => {
    process.exit(0);
  });
}
