import { integer, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

/** Nomes são únicos sem diferenciar maiúsculas (índice players_name_lower_idx em lower(name)). */
export const players = pgTable('players', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  /** Cargo: 'owner' | 'anfitriao' | 'dealer' | 'player' (lib/devo/cargos.ts; o antigo 'admin' virou 'owner'). */
  role: text('role').notNull().default('player'),
  /** Só Dealer: o Anfitrião (ou Owner) que o supervisiona. Ver scripts/fundacao-migration.sql. */
  supervisorId: uuid('supervisor_id'),
  /** Karma (ordem +, caos −). Nunca exibido cru ao jogador. */
  karma: integer('karma').notNull().default(0),
  avatar: text('avatar'),
  avatarUpdatedAt: timestamp('avatar_updated_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const playerSaves = pgTable('player_saves', {
  playerId: uuid('player_id')
    .primaryKey()
    .references(() => players.id, { onDelete: 'cascade' }),
  data: jsonb('data').notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  lastPulseAt: timestamp('last_pulse_at', { withTimezone: true }),
})

export const pushSubscriptions = pgTable('push_subscriptions', {
  endpoint: text('endpoint').primaryKey(),
  playerId: uuid('player_id')
    .notNull()
    .references(() => players.id, { onDelete: 'cascade' }),
  p256dh: text('p256dh').notNull(),
  auth: text('auth').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

/** Linha única (id = 1) com as chaves VAPID geradas no primeiro uso. */
export const pushConfig = pgTable('push_config', {
  id: integer('id').primaryKey(),
  publicKey: text('public_key').notNull(),
  privateKey: text('private_key').notNull(),
})
