import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  username: text('username').notNull(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(), // In a real app, hash this!
  joinedAt: integer('joined_at').notNull(),
});

export const moods = sqliteTable('moods', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').references(() => users.id).notNull(),
  score: integer('score').notNull(),
  label: text('label').notNull(),
  note: text('note'),
  timestamp: integer('timestamp').notNull(),
});

export const journals = sqliteTable('journals', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').references(() => users.id).notNull(),
  content: text('content').notNull(),
  timestamp: integer('timestamp').notNull(),
});

export const settings = sqliteTable('settings', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').references(() => users.id).notNull().unique(),
  notifications: integer('notifications', { mode: 'boolean' }).default(true),
  anonymousMode: integer('anonymous_mode', { mode: 'boolean' }).default(false),
});

export const userStats = sqliteTable('user_stats', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').references(() => users.id).notNull().unique(),
  streak: integer('streak').default(0),
  totalCheckIns: integer('total_check_ins').default(0),
  lastCheckInDate: integer('last_check_in_date'),
});
