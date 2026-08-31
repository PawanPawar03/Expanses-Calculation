import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { config } from './config';
import { authRouter } from './routes/auth.routes';
import { usersRouter } from './routes/users.routes';
import { expensesRouter } from './routes/expenses.routes';
import { categoriesRouter } from './routes/categories.routes';
import { reportsRouter } from './routes/reports.routes';
import { auditRouter } from './routes/audit.routes';
import { settingsRouter } from './routes/settings.routes';
import { formatISTDisplay, getNowInIST } from './utils/istDate';

const app = express();

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging in development
if (config.nodeEnv === 'development') {
  app.use((req, res, next) => {
    console.log(`[${formatISTDisplay(new Date())}] ${req.method} ${req.url}`);
    next();
  });
}

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'healthy',
    app: 'Whitehouse Expense Management API',
    ist_time: formatISTDisplay(new Date()),
    timezone: config.timezone,
  });
});

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/expenses', expensesRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/audit-logs', auditRouter);
app.use('/api/settings', settingsRouter);

// Serve static frontend in production if built
const clientDistPath = path.resolve(__dirname, '../../client/dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (req.url.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// 404 handler for unmatched API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found.` });
});

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled Server Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(config.nodeEnv === 'development' ? { stack: err.stack } : {}),
  });
});

// Start Server
app.listen(config.port, () => {
  console.log(`\n======================================================`);
  console.log(` 🏠 WHITEHOUSE EXPENSE MANAGEMENT SERVER RUNNING`);
  console.log(` 🌐 Server URL:  http://localhost:${config.port}`);
  console.log(` 🕒 System IST:  ${formatISTDisplay(new Date())}`);
  console.log(` 📂 Environment: ${config.nodeEnv}`);
  console.log(`======================================================\n`);
});
