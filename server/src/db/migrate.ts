import { initDatabase } from './init';
import { seedDatabase } from './seed';

initDatabase()
  .then(() => seedDatabase())
  .then(() => {
    console.log('Migration completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
