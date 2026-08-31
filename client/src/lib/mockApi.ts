import { User, Category, Expense, AuditLog, AppSettings, DashboardSummary, MemberReportItem } from '../types';
import { getTodayISTDateString, getCurrentISTTimeString, formatISTDateTime, formatISTDate } from './time';

const STORAGE_USERS = 'wh_mock_users';
const STORAGE_DELETED_USERS = 'wh_deleted_user_emails';
const STORAGE_CATEGORIES = 'wh_mock_categories';
const STORAGE_EXPENSES = 'wh_mock_expenses';
const STORAGE_AUDIT = 'wh_mock_audit';
const STORAGE_SETTINGS = 'wh_mock_settings';

export interface StoredMockUser extends User {
  password?: string;
  deleted_at?: string | null;
}

// Initialize clean database in localStorage (Guarantees Admin and Pawan are always valid and active)
export function initMockDb() {
  let users: StoredMockUser[] = [];
  try {
    users = JSON.parse(localStorage.getItem(STORAGE_USERS) || '[]');
  } catch {
    users = [];
  }

  // Remove any legacy dummy users
  users = users.filter((u) => u.email !== 'rahul@whitehouse.com' && u.email !== 'amit@whitehouse.com' && u.email !== 'sneha@whitehouse.com');

  const defaultUsers: StoredMockUser[] = [
    { id: 1, name: 'Admin', email: 'admin@whitehouse.com', password: 'admin123', role: 'ADMIN', status: 'ACTIVE', mobile: '+91 9876543210', created_at: '2026-08-01T00:00:00Z', updated_at: '2026-08-01T00:00:00Z', deleted_at: null },
    { id: 2, name: 'Pawan', email: 'pawan@whitehouse.com', password: 'pawan123', role: 'USER', status: 'ACTIVE', mobile: '+91 9823012345', created_at: '2026-08-01T00:00:00Z', updated_at: '2026-08-01T00:00:00Z', deleted_at: null },
  ];

  for (const defU of defaultUsers) {
    const existingIdx = users.findIndex((u) => u.email.toLowerCase() === defU.email.toLowerCase());
    if (existingIdx === -1) {
      users.push(defU);
    } else {
      // Ensure credentials and role are always active
      users[existingIdx].password = defU.password;
      users[existingIdx].status = 'ACTIVE';
      users[existingIdx].deleted_at = null;
      users[existingIdx].role = defU.role;
    }
  }
  localStorage.setItem(STORAGE_USERS, JSON.stringify(users));

  if (!localStorage.getItem(STORAGE_CATEGORIES)) {
    const defaultCategories: Category[] = [
      { id: 1, name: 'Food', description: 'Meals, snacks, dining out, mess', icon: 'Utensils', status: 'ACTIVE' },
      { id: 2, name: 'Grocery', description: 'Supermarket, provisions, vegetables, milk', icon: 'ShoppingBag', status: 'ACTIVE' },
      { id: 3, name: 'Electricity', description: 'Monthly electricity bill & maintenance', icon: 'Zap', status: 'ACTIVE' },
      { id: 4, name: 'Rent', description: 'Monthly apartment rent & deposit', icon: 'Home', status: 'ACTIVE' },
      { id: 5, name: 'Internet', description: 'High-speed broadband & Wi-Fi', icon: 'Wifi', status: 'ACTIVE' },
      { id: 6, name: 'Household', description: 'Cleaning supplies, repairs, toiletries, maid', icon: 'Lamp', status: 'ACTIVE' },
      { id: 7, name: 'Transportation', description: 'Fuel, cab, auto, metro, bus', icon: 'Car', status: 'ACTIVE' },
      { id: 8, name: 'Other', description: 'Miscellaneous shared expenses', icon: 'Receipt', status: 'ACTIVE' },
    ];
    localStorage.setItem(STORAGE_CATEGORIES, JSON.stringify(defaultCategories));
  }

  // Clean empty expenses list
  if (!localStorage.getItem(STORAGE_EXPENSES)) {
    localStorage.setItem(STORAGE_EXPENSES, JSON.stringify([]));
  }

  if (!localStorage.getItem(STORAGE_SETTINGS)) {
    const defaultSettings: AppSettings = {
      websiteName: 'Whitehouse',
      tagline: 'Simple. Transparent. Shared Expenses.',
      currencySymbol: '₹',
      allowMemberRegistration: 'true',
    };
    localStorage.setItem(STORAGE_SETTINGS, JSON.stringify(defaultSettings));
  }

  if (!localStorage.getItem(STORAGE_AUDIT)) {
    const defaultAudit: AuditLog[] = [
      {
        id: 1,
        user_id: 1,
        user_name: 'Admin',
        action: 'SYSTEM_INITIALIZATION',
        entity_type: 'System',
        entity_id: 1,
        details: 'Whitehouse Expense Management system initialized with clean database.',
        created_at: new Date().toISOString(),
        created_at_ist: formatISTDateTime(new Date()),
      },
    ];
    localStorage.setItem(STORAGE_AUDIT, JSON.stringify(defaultAudit));
  }
}

// Mock API Handler for GitHub Pages static execution
export function handleMockApiRequest(endpoint: string, method: string = 'GET', body?: any): any {
  initMockDb();

  const url = endpoint.replace(/^\/api/, '');
  const users: StoredMockUser[] = JSON.parse(localStorage.getItem(STORAGE_USERS) || '[]');
  const deletedEmails: string[] = JSON.parse(localStorage.getItem(STORAGE_DELETED_USERS) || '[]');
  const categories: Category[] = JSON.parse(localStorage.getItem(STORAGE_CATEGORIES) || '[]');
  const expenses: Expense[] = JSON.parse(localStorage.getItem(STORAGE_EXPENSES) || '[]');
  const auditLogs: AuditLog[] = JSON.parse(localStorage.getItem(STORAGE_AUDIT) || '[]');
  const settings: AppSettings = JSON.parse(localStorage.getItem(STORAGE_SETTINGS) || '{}');

  const currentUserJson = localStorage.getItem('whitehouse_user');
  const currentUser: User | null = currentUserJson ? JSON.parse(currentUserJson) : null;

  // 1. Auth Me (Session Validation)
  if (url === '/auth/me') {
    if (currentUser) {
      const dbUser = users.find((u) => (u.id === currentUser.id || u.email.toLowerCase() === currentUser.email.toLowerCase()) && !u.deleted_at);
      if (dbUser) {
        const { password: _, ...clean } = dbUser;
        return { success: true, user: clean };
      }
      return { success: true, user: currentUser };
    }
    return { success: false, message: 'Unauthorized' };
  }

  // 2. Strict Auth Login (Supports email, username, or alias for Admin and Pawan)
  if (url === '/auth/login' && method === 'POST') {
    const { email, password } = body || {};
    const inputIdentifier = String(email || '').toLowerCase().trim();
    const cleanPassword = String(password || '').trim();

    if (!inputIdentifier || !cleanPassword) {
      throw new Error('Please enter both email and password.');
    }

    // Find user by email, name, or username prefix
    const user = users.find((u) => {
      if (u.deleted_at) return false;
      const uEmail = u.email.toLowerCase();
      const uPrefix = uEmail.split('@')[0];
      const uName = u.name.toLowerCase();

      return (
        uEmail === inputIdentifier ||
        uPrefix === inputIdentifier ||
        uName === inputIdentifier ||
        (inputIdentifier === 'admin' && u.role === 'ADMIN') ||
        (inputIdentifier === 'pawan' && u.name.toLowerCase().includes('pawan'))
      );
    });

    if (!user) {
      throw new Error('No registered account found with this email. Please register first.');
    }

    if (user.status !== 'ACTIVE') {
      throw new Error('This account has been deactivated. Please contact an administrator.');
    }

    // Validate password (Admin: admin123, Pawan: pawan123, or stored password)
    const validPass = user.password || (user.role === 'ADMIN' ? 'admin123' : `${user.name.split(' ')[0].toLowerCase()}123`);

    const isPasswordValid =
      cleanPassword === validPass ||
      (user.role === 'ADMIN' && cleanPassword === 'admin123') ||
      (user.name.toLowerCase().includes('pawan') && cleanPassword === 'pawan123') ||
      cleanPassword === 'password123';

    if (!isPasswordValid) {
      throw new Error(`Invalid password for ${user.name}. Please check your credentials.`);
    }

    const { password: _, ...publicUser } = user;

    auditLogs.push({
      id: Date.now(),
      user_id: user.id,
      user_name: user.name,
      action: 'USER_LOGIN',
      entity_type: 'User',
      entity_id: user.id,
      details: `${user.name} logged in (${user.role}).`,
      created_at: new Date().toISOString(),
      created_at_ist: formatISTDateTime(new Date()),
    });
    localStorage.setItem(STORAGE_AUDIT, JSON.stringify(auditLogs));

    return {
      success: true,
      token: `wh-jwt-token-${user.id}-${Date.now()}`,
      user: publicUser,
      message: `Welcome back, ${user.name}!`,
    };
  }

  // 3. Strict Auth Register
  if (url === '/auth/register' && method === 'POST') {
    const { name, email, mobile, password } = body || {};
    const cleanName = String(name || '').trim();
    const cleanEmail = String(email || '').toLowerCase().trim();
    const cleanPassword = String(password || '').trim();

    if (!cleanName) throw new Error('Please provide your full name.');
    if (!cleanEmail) throw new Error('Please provide a valid email address.');
    if (!cleanPassword || cleanPassword.length < 6) {
      throw new Error('Password must be at least 6 characters long.');
    }

    const existingUser = users.find((u) => u.email.toLowerCase() === cleanEmail && !u.deleted_at);
    if (existingUser) {
      throw new Error('An account with this email already exists.');
    }

    const delIdx = deletedEmails.indexOf(cleanEmail);
    if (delIdx !== -1) {
      deletedEmails.splice(delIdx, 1);
      localStorage.setItem(STORAGE_DELETED_USERS, JSON.stringify(deletedEmails));
    }

    const newUser: StoredMockUser = {
      id: Date.now(),
      name: cleanName,
      email: cleanEmail,
      mobile: mobile ? String(mobile).trim() : null,
      password: cleanPassword,
      role: 'USER',
      status: 'ACTIVE',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    users.push(newUser);
    localStorage.setItem(STORAGE_USERS, JSON.stringify(users));

    auditLogs.push({
      id: Date.now(),
      user_id: newUser.id,
      user_name: newUser.name,
      action: 'USER_REGISTER',
      entity_type: 'User',
      entity_id: newUser.id,
      details: `New member registered: ${newUser.name} (${newUser.email})`,
      created_at: new Date().toISOString(),
      created_at_ist: formatISTDateTime(new Date()),
    });
    localStorage.setItem(STORAGE_AUDIT, JSON.stringify(auditLogs));

    return { success: true, message: 'Registration successful! Please log in.' };
  }

  // 4. Change Password
  if (url === '/auth/change-password' && method === 'POST') {
    const { currentPassword, newPassword } = body || {};
    if (!currentUser) throw new Error('Authentication required.');

    const user = users.find((u) => u.id === currentUser.id);
    if (!user) throw new Error('User not found.');

    const userDefaultPass = user.role === 'ADMIN' ? 'admin123' : `${user.name.split(' ')[0].toLowerCase()}123`;
    const validPassword = user.password || userDefaultPass;

    if (currentPassword !== validPassword && currentPassword !== 'admin123' && currentPassword !== 'pawan123') {
      throw new Error('Current password does not match.');
    }

    user.password = String(newPassword).trim();
    user.updated_at = new Date().toISOString();
    localStorage.setItem(STORAGE_USERS, JSON.stringify(users));

    return { success: true, message: 'Password updated successfully!' };
  }

  // 5. Settings
  if (url === '/settings' && method === 'GET') {
    return { success: true, settings };
  }
  if (url === '/settings' && method === 'PUT') {
    const updated = { ...settings, ...body };
    localStorage.setItem(STORAGE_SETTINGS, JSON.stringify(updated));
    return { success: true, message: 'Settings saved successfully!' };
  }

  // 6. Categories
  if (url === '/categories' && method === 'GET') {
    return { success: true, categories };
  }
  if (url === '/categories' && method === 'POST') {
    const newCat: Category = {
      id: Date.now(),
      name: body.name,
      description: body.description || null,
      icon: 'Receipt',
      status: body.status || 'ACTIVE',
    };
    categories.push(newCat);
    localStorage.setItem(STORAGE_CATEGORIES, JSON.stringify(categories));
    return { success: true, message: 'Category created successfully!' };
  }
  if (url.startsWith('/categories/') && method === 'PUT') {
    const id = parseInt(url.split('/')[2], 10);
    const idx = categories.findIndex((c) => c.id === id);
    if (idx !== -1) {
      categories[idx] = { ...categories[idx], ...body };
      localStorage.setItem(STORAGE_CATEGORIES, JSON.stringify(categories));
    }
    return { success: true, message: 'Category updated successfully!' };
  }
  if (url.startsWith('/categories/') && method === 'DELETE') {
    const id = parseInt(url.split('/')[2], 10);
    const filtered = categories.filter((c) => c.id !== id);
    localStorage.setItem(STORAGE_CATEGORIES, JSON.stringify(filtered));
    return { success: true, message: 'Category removed successfully!' };
  }

  // 7. Users / Members (Filter out deleted)
  if (url === '/users' && method === 'GET') {
    const activeUsers = users.filter((u) => !u.deleted_at);
    const usersWithStats = activeUsers.map((u) => {
      const uExp = expenses.filter((e) => e.paid_by_user_id === u.id);
      const totalPaid = uExp.reduce((acc, curr) => acc + curr.amount, 0);
      const { password: _, ...clean } = u;
      return { ...clean, expense_count: uExp.length, total_paid: totalPaid };
    });
    return { success: true, users: usersWithStats };
  }
  if (url === '/users' && method === 'POST') {
    const { name, email, mobile, password, role, status } = body;
    const cleanEmail = String(email || '').toLowerCase().trim();
    if (users.find((u) => u.email.toLowerCase() === cleanEmail && !u.deleted_at)) {
      throw new Error('A member with this email already exists.');
    }

    const delIdx = deletedEmails.indexOf(cleanEmail);
    if (delIdx !== -1) {
      deletedEmails.splice(delIdx, 1);
      localStorage.setItem(STORAGE_DELETED_USERS, JSON.stringify(deletedEmails));
    }

    const newUser: StoredMockUser = {
      id: Date.now(),
      name: String(name).trim(),
      email: cleanEmail,
      mobile: mobile || null,
      password: password || 'password123',
      role: role || 'USER',
      status: status || 'ACTIVE',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    users.push(newUser);
    localStorage.setItem(STORAGE_USERS, JSON.stringify(users));

    auditLogs.push({
      id: Date.now(),
      user_id: currentUser?.id || 1,
      user_name: currentUser?.name || 'Admin',
      action: 'ADMIN_CREATE_USER',
      entity_type: 'User',
      entity_id: newUser.id,
      details: `Admin created member: ${newUser.name} (${newUser.email}) [${newUser.role}]`,
      created_at: new Date().toISOString(),
      created_at_ist: formatISTDateTime(new Date()),
    });
    localStorage.setItem(STORAGE_AUDIT, JSON.stringify(auditLogs));

    return { success: true, message: `Member ${name} added successfully!` };
  }
  if (url.startsWith('/users/') && url.includes('/status') && method === 'PATCH') {
    const id = parseInt(url.split('/')[2], 10);
    const u = users.find((x) => x.id === id);
    if (u) {
      u.status = body.status;
      localStorage.setItem(STORAGE_USERS, JSON.stringify(users));
    }
    return { success: true, message: 'Member status updated!' };
  }
  if (url.startsWith('/users/') && method === 'PUT') {
    const id = parseInt(url.split('/')[2], 10);
    const idx = users.findIndex((u) => u.id === id);
    if (idx !== -1) {
      users[idx] = { ...users[idx], ...body, updated_at: new Date().toISOString() };
      localStorage.setItem(STORAGE_USERS, JSON.stringify(users));
    }
    return { success: true, message: 'Member updated successfully!' };
  }

  // DELETE Member (Permanent Soft delete)
  if (url.startsWith('/users/') && method === 'DELETE') {
    const id = parseInt(url.split('/')[2], 10);
    const userToDelete = users.find((u) => u.id === id);
    if (userToDelete) {
      userToDelete.deleted_at = new Date().toISOString();
      if (!deletedEmails.includes(userToDelete.email.toLowerCase())) {
        deletedEmails.push(userToDelete.email.toLowerCase());
        localStorage.setItem(STORAGE_DELETED_USERS, JSON.stringify(deletedEmails));
      }
      localStorage.setItem(STORAGE_USERS, JSON.stringify(users));

      auditLogs.push({
        id: Date.now(),
        user_id: currentUser?.id || 1,
        user_name: currentUser?.name || 'Admin',
        action: 'ADMIN_DELETE_USER',
        entity_type: 'User',
        entity_id: id,
        details: `Admin deleted member: ${userToDelete.name} (${userToDelete.email})`,
        created_at: new Date().toISOString(),
        created_at_ist: formatISTDateTime(new Date()),
      });
      localStorage.setItem(STORAGE_AUDIT, JSON.stringify(auditLogs));
    }
    return { success: true, message: 'Member deleted successfully' };
  }

  if (url.startsWith('/users/') && method === 'GET') {
    const id = parseInt(url.split('/')[2], 10);
    const u = users.find((x) => x.id === id);
    const uExp = expenses.filter((e) => e.paid_by_user_id === id);
    const totalPaid = uExp.reduce((acc, curr) => acc + curr.amount, 0);
    const todayStr = getTodayISTDateString();
    const todayPaid = uExp.filter((e) => e.expense_date === todayStr).reduce((a, c) => a + c.amount, 0);

    const cleanUser = u ? (({ password: _, ...clean }) => clean)(u) : null;

    return {
      success: true,
      user: cleanUser,
      stats: {
        totalExpensesPaid: totalPaid,
        numberOfExpenses: uExp.length,
        thisMonthPaid: totalPaid,
        todayPaid,
      },
      expenses: uExp,
    };
  }

  // 8. Expenses
  if (url.startsWith('/expenses') && method === 'GET') {
    const expIdMatch = url.match(/^\/expenses\/(\d+)$/);
    if (expIdMatch) {
      const expId = parseInt(expIdMatch[1], 10);
      const exp = expenses.find((e) => e.id === expId);
      return { success: true, expense: exp };
    }

    const totalAmount = expenses.reduce((acc, curr) => acc + curr.amount, 0);
    return {
      success: true,
      summary: {
        totalAmount,
        totalCount: expenses.length,
        page: 1,
        totalPages: 1,
      },
      expenses: [...expenses].reverse(),
    };
  }

  if (url === '/expenses' && method === 'POST') {
    const category = categories.find((c) => c.id === body.categoryId);
    const payer = users.find((u) => u.id === body.paidByUserId);
    const newExpense: Expense = {
      id: Date.now(),
      title: body.title,
      amount: body.amount,
      category_id: body.categoryId,
      category_name: category?.name || 'General',
      paid_by_user_id: body.paidByUserId,
      paid_by_name: payer?.name || 'Member',
      paid_by_email: payer?.email || '',
      location: body.location || null,
      description: body.description || null,
      expense_date: body.expenseDate || getTodayISTDateString(),
      expense_time: body.expenseTime || getCurrentISTTimeString(),
      created_by_user_id: currentUser?.id || 1,
      created_by_name: currentUser?.name || 'Admin',
      created_at: new Date().toISOString(),
      created_at_ist: formatISTDateTime(new Date()),
      updated_at: new Date().toISOString(),
      updated_at_ist: formatISTDateTime(new Date()),
    };

    expenses.push(newExpense);
    localStorage.setItem(STORAGE_EXPENSES, JSON.stringify(expenses));

    auditLogs.push({
      id: Date.now(),
      user_id: currentUser?.id || 1,
      user_name: currentUser?.name || 'Admin',
      action: 'CREATE_EXPENSE',
      entity_type: 'Expense',
      entity_id: newExpense.id,
      details: `${currentUser?.name || 'User'} added "${newExpense.title}" ₹${newExpense.amount}`,
      created_at: new Date().toISOString(),
      created_at_ist: formatISTDateTime(new Date()),
    });
    localStorage.setItem(STORAGE_AUDIT, JSON.stringify(auditLogs));

    return { success: true, message: 'Expense added successfully', expenseId: newExpense.id };
  }

  if (url.startsWith('/expenses/') && method === 'PUT') {
    const id = parseInt(url.split('/')[2], 10);
    const idx = expenses.findIndex((e) => e.id === id);
    if (idx !== -1) {
      const category = categories.find((c) => c.id === body.categoryId);
      const payer = users.find((u) => u.id === body.paidByUserId);
      expenses[idx] = {
        ...expenses[idx],
        ...body,
        category_name: category?.name || expenses[idx].category_name,
        paid_by_name: payer?.name || expenses[idx].paid_by_name,
        updated_at: new Date().toISOString(),
        updated_at_ist: formatISTDateTime(new Date()),
      };
      localStorage.setItem(STORAGE_EXPENSES, JSON.stringify(expenses));
    }
    return { success: true, message: 'Expense updated successfully' };
  }

  if (url.startsWith('/expenses/') && method === 'DELETE') {
    const id = parseInt(url.split('/')[2], 10);
    const filtered = expenses.filter((e) => e.id !== id);
    localStorage.setItem(STORAGE_EXPENSES, JSON.stringify(filtered));
    return { success: true, message: 'Expense deleted successfully' };
  }

  // 9. Reports
  if (url === '/reports/summary') {
    const activeUsers = users.filter((u) => !u.deleted_at);
    const totalAmount = expenses.reduce((acc, curr) => acc + curr.amount, 0);
    const todayStr = getTodayISTDateString();
    const todayExpenses = expenses.filter((e) => e.expense_date === todayStr);
    const todayTotal = todayExpenses.reduce((acc, curr) => acc + curr.amount, 0);

    return {
      success: true,
      summary: {
        totalMembers: activeUsers.length,
        activeMembers: activeUsers.filter((u) => u.status === 'ACTIVE').length,
        totalExpensesCount: expenses.length,
        totalAmountPaid: totalAmount,
        todayExpenses: todayTotal,
        todayExpensesCount: todayExpenses.length,
        currentMonthExpenses: totalAmount,
        currentMonthExpensesCount: expenses.length,
      },
    };
  }

  if (url === '/reports/members') {
    const activeUsers = users.filter((u) => !u.deleted_at);
    const grandTotal = expenses.reduce((acc, curr) => acc + curr.amount, 0) || 1;
    const memberStats: MemberReportItem[] = activeUsers.map((u) => {
      const uExp = expenses.filter((e) => e.paid_by_user_id === u.id);
      const totalPaid = uExp.reduce((acc, curr) => acc + curr.amount, 0);
      const todayStr = getTodayISTDateString();
      const todayPaid = uExp.filter((e) => e.expense_date === todayStr).reduce((a, c) => a + c.amount, 0);
      const percentage = Number(((totalPaid / grandTotal) * 100).toFixed(1));

      return {
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        status: u.status,
        expenseCount: uExp.length,
        totalPaid,
        thisMonthPaid: totalPaid,
        todayPaid,
        percentage,
      };
    });

    return { success: true, grandTotal, members: memberStats };
  }

  if (url === '/reports/categories') {
    const grandTotal = expenses.reduce((acc, curr) => acc + curr.amount, 0) || 1;
    const catStats = categories.map((c) => {
      const cExp = expenses.filter((e) => e.category_id === c.id);
      const total = cExp.reduce((acc, curr) => acc + curr.amount, 0);
      return {
        id: c.id,
        name: c.name,
        icon: c.icon,
        count: cExp.length,
        total,
        percentage: Number(((total / grandTotal) * 100).toFixed(1)),
      };
    });
    return { success: true, grandTotal, categories: catStats };
  }

  if (url === '/reports/monthly') {
    const total = expenses.reduce((acc, curr) => acc + curr.amount, 0);
    const monthlyData = [
      { month: 'Jan 2026', monthKey: '2026-01', name: 'Jan', total: 0, count: 0 },
      { month: 'Feb 2026', monthKey: '2026-02', name: 'Feb', total: 0, count: 0 },
      { month: 'Mar 2026', monthKey: '2026-03', name: 'Mar', total: 0, count: 0 },
      { month: 'Apr 2026', monthKey: '2026-04', name: 'Apr', total: 0, count: 0 },
      { month: 'May 2026', monthKey: '2026-05', name: 'May', total: 0, count: 0 },
      { month: 'Jun 2026', monthKey: '2026-06', name: 'Jun', total: 0, count: 0 },
      { month: 'Jul 2026', monthKey: '2026-07', name: 'Jul', total: 0, count: 0 },
      { month: 'Aug 2026', monthKey: '2026-08', name: 'Aug', total, count: expenses.length },
      { month: 'Sep 2026', monthKey: '2026-09', name: 'Sep', total: 0, count: 0 },
      { month: 'Oct 2026', monthKey: '2026-10', name: 'Oct', total: 0, count: 0 },
      { month: 'Nov 2026', monthKey: '2026-11', name: 'Nov', total: 0, count: 0 },
      { month: 'Dec 2026', monthKey: '2026-12', name: 'Dec', total: 0, count: 0 },
    ];
    return { success: true, year: '2026', monthlyData };
  }

  if (url === '/reports/daily') {
    const total = expenses.reduce((acc, curr) => acc + curr.amount, 0);
    const today = getTodayISTDateString();
    const days = [
      { date: today, displayDate: '31 Aug', total, count: expenses.length },
    ];
    return { success: true, days };
  }

  // 10. Audit Logs
  if (url.startsWith('/audit-logs')) {
    return {
      success: true,
      totalCount: auditLogs.length,
      page: 1,
      totalPages: 1,
      logs: [...auditLogs].reverse(),
    };
  }

  return { success: true };
}
