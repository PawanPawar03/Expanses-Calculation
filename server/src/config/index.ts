import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  jwtSecret: process.env.JWT_SECRET || 'whitehouse_default_secret_key_change_in_prod_2026',
  nodeEnv: process.env.NODE_ENV || 'development',
  timezone: process.env.TIMEZONE || 'Asia/Kolkata',
  dbPath: path.resolve(__dirname, '../../data/whitehouse.db'),
};
