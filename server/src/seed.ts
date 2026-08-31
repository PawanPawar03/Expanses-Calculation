import bcrypt from 'bcryptjs';
import { db, initDatabase } from './db';
import { getUTCNow, getCurrentISTDateString, getNowInIST, IST_TIMEZONE } from './utils/istDate';
import { format as formatZoned } from 'date-fns-tz';
import { subDays } from 'date-fns';

async function seed() {
  console.log('🌱 Initializing database and running seed...');
  initDatabase();

  const nowUTC = getUTCNow();
  const defaultPassword = 'password123'; // Base fallback

  // 1. Seed Users
  const usersToSeed = [
    { name: 'Admin', email: 'admin@whitehouse.com', password: 'admin123', role: 'ADMIN', mobile: '+91 9876543210' },
    { name: 'Pawan Pawar', email: 'pawan@whitehouse.com', password: 'pawan123', role: 'USER', mobile: '+91 9823012345' },
    { name: 'Rahul Sharma', email: 'rahul@whitehouse.com', password: 'rahul123', role: 'USER', mobile: '+91 9823023456' },
    { name: 'Amit Verma', email: 'amit@whitehouse.com', password: 'amit123', role: 'USER', mobile: '+91 9823034567' },
    { name: 'Sneha Patel', email: 'sneha@whitehouse.com', password: 'sneha123', role: 'USER', mobile: '+91 9823045678' },
  ];

  const userIds: Record<string, number> = {};

  for (const u of usersToSeed) {
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(u.email) as { id: number } | undefined;
    if (!existing) {
      const hash = await bcrypt.hash(u.password, 10);
      const res = db.prepare(`
        INSERT INTO users (name, email, password_hash, mobile, role, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, 'ACTIVE', ?, ?)
      `).run(u.name, u.email, hash, u.mobile, u.role, nowUTC, nowUTC);
      userIds[u.email] = Number(res.lastInsertRowid);
      console.log(`Created user: ${u.name} (${u.email}) [${u.role}]`);
    } else {
      userIds[u.email] = existing.id;
    }
  }

  // 2. Seed Categories
  const categoriesToSeed = [
    { name: 'Food', description: 'Meals, snacks, dining out, mess', icon: 'Utensils' },
    { name: 'Grocery', description: 'Supermarket, provisions, vegetables, milk', icon: 'ShoppingBag' },
    { name: 'Electricity', description: 'Monthly electricity bill & maintenance', icon: 'Zap' },
    { name: 'Rent', description: 'Monthly apartment rent & deposit', icon: 'Home' },
    { name: 'Internet', description: 'High-speed broadband & Wi-Fi', icon: 'Wifi' },
    { name: 'Transportation', description: 'Fuel, cab, auto, metro, bus', icon: 'Car' },
    { name: 'Medical', description: 'Medicines, clinic visits, emergency healthcare', icon: 'HeartPulse' },
    { name: 'Household', description: 'Cleaning supplies, repairs, toiletries, maid', icon: 'Lamp' },
    { name: 'Entertainment', description: 'Streaming, movies, group outings, games', icon: 'Film' },
    { name: 'Other', description: 'Miscellaneous shared expenses', icon: 'Receipt' },
  ];

  const categoryIds: Record<string, number> = {};

  for (const c of categoriesToSeed) {
    const existing = db.prepare('SELECT id FROM categories WHERE name = ?').get(c.name) as { id: number } | undefined;
    if (!existing) {
      const res = db.prepare(`
        INSERT INTO categories (name, description, icon, status, created_at, updated_at)
        VALUES (?, ?, ?, 'ACTIVE', ?, ?)
      `).run(c.name, c.description, c.icon, nowUTC, nowUTC);
      categoryIds[c.name] = Number(res.lastInsertRowid);
      console.log(`Created category: ${c.name}`);
    } else {
      categoryIds[c.name] = existing.id;
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

  // 4. Seed Expenses
  const nowIST = getNowInIST();
  const getPastISTDate = (daysAgo: number) => {
    const d = subDays(nowIST, daysAgo);
    return formatZoned(d, 'yyyy-MM-dd', { timeZone: IST_TIMEZONE });
  };

  const sampleExpenses = [
    {
      title: 'Chapati & Dinner',
      amount: 120,
      category: 'Food',
      paidBy: 'pawan@whitehouse.com',
      createdBy: 'pawan@whitehouse.com',
      location: 'ABC Restaurant',
      description: 'Dinner chapati and curry for flatmates',
      daysAgo: 0,
      time: '04:05 PM',
    },
    {
      title: 'Fresh Milk & Bread',
      amount: 60,
      category: 'Grocery',
      paidBy: 'rahul@whitehouse.com',
      createdBy: 'rahul@whitehouse.com',
      location: 'Amul Dairy Store',
      description: 'Morning cow milk (1L) and whole wheat bread',
      daysAgo: 0,
      time: '08:30 AM',
    },
    {
      title: 'Drinking Water Can Refills',
      amount: 160,
      category: 'Household',
      paidBy: 'pawan@whitehouse.com',
      createdBy: 'pawan@whitehouse.com',
      location: 'Aqua Pure Delivery',
      description: '4 Bisleri 20L cans delivery',
      daysAgo: 0,
      time: '10:15 AM',
    },
    {
      title: 'Monthly Groceries & Spices',
      amount: 850,
      category: 'Grocery',
      paidBy: 'amit@whitehouse.com',
      createdBy: 'amit@whitehouse.com',
      location: 'D-Mart Supermarket',
      description: 'Rice, dal, cooking oil, spices, and snacks',
      daysAgo: 1,
      time: '05:45 PM',
    },
    {
      title: 'Vegetables & Fruits',
      amount: 340,
      category: 'Food',
      paidBy: 'amit@whitehouse.com',
      createdBy: 'amit@whitehouse.com',
      location: 'Local Weekly Mandi',
      description: 'Onions, potatoes, tomatoes, coriander, and bananas',
      daysAgo: 2,
      time: '06:10 PM',
    },
    {
      title: 'Medicines & First Aid Kit',
      amount: 280,
      category: 'Medical',
      paidBy: 'sneha@whitehouse.com',
      createdBy: 'sneha@whitehouse.com',
      location: 'Apollo Pharmacy',
      description: 'Paracetamol, bandages, Dettol, and cough syrup',
      daysAgo: 4,
      time: '07:20 PM',
    },
    {
      title: 'Electricity Bill',
      amount: 1500,
      category: 'Electricity',
      paidBy: 'pawan@whitehouse.com',
      createdBy: 'admin@whitehouse.com',
      location: 'MSEB Electricity Portal',
      description: 'Monthly flat electricity consumption bill',
      daysAgo: 5,
      time: '11:20 AM',
    },
    {
      title: 'JioFiber High-Speed Internet',
      amount: 799,
      category: 'Internet',
      paidBy: 'sneha@whitehouse.com',
      createdBy: 'sneha@whitehouse.com',
      location: 'JioFiber Online Recharge',
      description: '100 Mbps unlimited monthly broadband pack',
      daysAgo: 8,
      time: '02:15 PM',
    },
    {
      title: 'Household Cleaning Supplies',
      amount: 420,
      category: 'Household',
      paidBy: 'rahul@whitehouse.com',
      createdBy: 'rahul@whitehouse.com',
      location: 'Reliance Fresh',
      description: 'Lizol floor cleaner, Vim bar, garbage bags, Colin',
      daysAgo: 11,
      time: '01:40 PM',
    },
    {
      title: 'House Maid Salary (Shared)',
      amount: 2000,
      category: 'Household',
      paidBy: 'pawan@whitehouse.com',
      createdBy: 'pawan@whitehouse.com',
      location: 'Whitehouse Residence',
      description: 'Monthly sweeping, mopping, and utensil cleaning',
      daysAgo: 14,
      time: '09:00 AM',
    },
    {
      title: 'Weekend Movie Night Snacks',
      amount: 520,
      category: 'Entertainment',
      paidBy: 'rahul@whitehouse.com',
      createdBy: 'rahul@whitehouse.com',
      location: 'Swiggy Instamart',
      description: 'Popcorn, cold drinks, and nachos for group movie',
      daysAgo: 18,
      time: '09:30 PM',
    },
    {
      title: 'Gas Cylinder Refill (HP Gas)',
      amount: 950,
      category: 'Household',
      paidBy: 'amit@whitehouse.com',
      createdBy: 'amit@whitehouse.com',
      location: 'HP Gas Agency',
      description: 'Kitchen 14.2kg LPG cylinder refill',
      daysAgo: 22,
      time: '03:10 PM',
    },
  ];

  const existingExpenses = db.prepare('SELECT COUNT(id) as count FROM expenses').get() as { count: number };
  if (existingExpenses.count === 0) {
    for (const exp of sampleExpenses) {
      const catId = categoryIds[exp.category];
      const paidById = userIds[exp.paidBy];
      const createdById = userIds[exp.createdBy] || paidById;
      const expenseDate = getPastISTDate(exp.daysAgo);

      db.prepare(`
        INSERT INTO expenses (
          title, amount, category_id, paid_by_user_id, location, description, 
          expense_date, expense_time, created_by_user_id, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        exp.title,
        exp.amount,
        catId,
        paidById,
        exp.location,
        exp.description,
        expenseDate,
        exp.time,
        createdById,
        nowUTC,
        nowUTC
      );
    }
    console.log(`✅ Seeded ${sampleExpenses.length} sample expenses!`);
  }

  // 5. Seed Initial Audit Logs
  const existingAudit = db.prepare('SELECT COUNT(id) as count FROM audit_logs').get() as { count: number };
  if (existingAudit.count === 0) {
    const adminId = userIds['admin@whitehouse.com'];
    db.prepare(`
      INSERT INTO audit_logs (user_id, user_name, action, entity_type, entity_id, details, created_at)
      VALUES 
        (?, 'Admin', 'SYSTEM_INITIALIZATION', 'System', 1, 'Whitehouse Expense Management system initialized with seed database.', ?),
        (?, 'Admin', 'ADMIN_CREATE_USER', 'User', ?, 'Admin created default household members Pawan, Rahul, Amit, Sneha.', ?),
        (?, 'Pawan Pawar', 'CREATE_EXPENSE', 'Expense', 1, 'Pawan added expense "Chapati & Dinner" ₹120', ?)
    `).run(adminId, nowUTC, adminId, userIds['pawan@whitehouse.com'], nowUTC, userIds['pawan@whitehouse.com'], nowUTC);
  }

  console.log('✨ Seed completed successfully!');
}

seed().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
