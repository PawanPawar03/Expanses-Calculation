import bcrypt from 'bcryptjs';
import { db, initDatabase } from './db';
import { getUTCNow } from './utils/istDate';

async function seed() {
  console.log('🌱 Initializing clean database...');
  initDatabase();

  const nowUTC = getUTCNow();

  // 1. Seed ONLY Admin and Pawan (No dummy members)
  const usersToSeed = [
    { name: 'Admin', email: 'admin@whitehouse.com', password: 'admin123', role: 'ADMIN', mobile: '+91 9876543210' },
    { name: 'Pawan', email: 'pawan@whitehouse.com', password: 'pawan123', role: 'USER', mobile: '+91 9823012345' },
  ];

  for (const u of usersToSeed) {
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(u.email) as { id: number } | undefined;
    if (!existing) {
      const hash = await bcrypt.hash(u.password, 10);
      db.prepare(`
        INSERT INTO users (name, email, password_hash, mobile, role, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, 'ACTIVE', ?, ?)
      `).run(u.name, u.email, hash, u.mobile, u.role, nowUTC, nowUTC);
      console.log(`Created user: ${u.name} (${u.email}) [${u.role}]`);
    }
  }

  // 2. Seed Standard Categories
  const categoriesToSeed = [
    { name: 'Food', description: 'Meals, snacks, dining out, mess', icon: 'Utensils' },
    { name: 'Grocery', description: 'Supermarket, provisions, vegetables, milk', icon: 'ShoppingBag' },
    { name: 'Electricity', description: 'Monthly electricity bill & maintenance', icon: 'Zap' },
    { name: 'Rent', description: 'Monthly apartment rent & deposit', icon: 'Home' },
    { name: 'Internet', description: 'High-speed broadband & Wi-Fi', icon: 'Wifi' },
    { name: 'Household', description: 'Cleaning supplies, repairs, toiletries, maid', icon: 'Lamp' },
    { name: 'Transportation', description: 'Fuel, cab, auto, metro, bus', icon: 'Car' },
    { name: 'Other', description: 'Miscellaneous shared expenses', icon: 'Receipt' },
  ];

  for (const c of categoriesToSeed) {
    const existing = db.prepare('SELECT id FROM categories WHERE name = ?').get(c.name) as { id: number } | undefined;
    if (!existing) {
      db.prepare(`
        INSERT INTO categories (name, description, icon, status, created_at, updated_at)
        VALUES (?, ?, ?, 'ACTIVE', ?, ?)
      `).run(c.name, c.description, c.icon, nowUTC, nowUTC);
      console.log(`Created category: ${c.name}`);
    }
  }

  // 3. Seed App Settings
  const settingsToSeed = [
    { key: 'websiteName', value: 'Whitehouse' },
    { key: 'tagline', value: 'Simple. Transparent. Shared Expenses.' },
    { key: 'currencySymbol', value: '₹' },
    { key: 'allowMemberRegistration', value: 'true' },
  ];

  for (const s of settingsToSeed) {
    db.prepare(`
      INSERT OR IGNORE INTO settings (key, value, updated_at)
      VALUES (?, ?, ?)
    `).run(s.key, s.value, nowUTC);
  }

  // 4. Clean 0 Initial Expenses (No fake dummy data)
  console.log('✨ Clean database ready with 0 dummy expenses! Only real Admin & Pawan accounts initialized.');
}

seed().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
