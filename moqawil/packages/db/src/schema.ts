/**
 * Moqawil Database Schema — Drizzle ORM + PostgreSQL 16
 * All 5 core tables as defined in CLAUDE.md §8
 *
 * Invoice numbering uses DB advisory locks + transactions (see DBA skill).
 * Never delete invoices — soft-delete or cancel status only (CGI Article 211: 10-year retention).
 */

import {
  pgTable,
  pgEnum,
  uuid,
  text,
  integer,
  numeric,
  date,
  timestamp,
  unique,
  index,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// ── Enums ────────────────────────────────────────────────────────────────────

export const activityTypeEnum = pgEnum('activity_type', [
  'commercial',
  'industrial',
  'artisanal',
  'service',
])

export const clientTypeEnum = pgEnum('client_type', [
  'individual',
  'company_ma',
  'company_foreign',
])

export const invoiceStatusEnum = pgEnum('invoice_status', [
  'draft',
  'sent',
  'paid',
  'cancelled',
])

export const paymentMethodEnum = pgEnum('payment_method', [
  'virement',
  'cheque',
  'espece',
  'effet',
  'carte',
  'other',
])

export const declarationStatusEnum = pgEnum('declaration_status', ['pending', 'submitted'])

// ── Users (managed by Auth.js) ───────────────────────────────────────────────

export const users = pgTable('users', {
  id: text('id').primaryKey(),  // Auth.js uses text IDs
  name: text('name'),
  email: text('email').unique().notNull(),
  emailVerified: timestamp('email_verified'),
  image: text('image'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// Auth.js adapter tables
export const accounts = pgTable('accounts', {
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  provider: text('provider').notNull(),
  providerAccountId: text('provider_account_id').notNull(),
  refreshToken: text('refresh_token'),
  accessToken: text('access_token'),
  expiresAt: integer('expires_at'),
  tokenType: text('token_type'),
  scope: text('scope'),
  idToken: text('id_token'),
  sessionState: text('session_state'),
})

export const sessions = pgTable('sessions', {
  sessionToken: text('session_token').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires').notNull(),
})

export const verificationTokens = pgTable('verification_tokens', {
  identifier: text('identifier').notNull(),
  token: text('token').notNull(),
  expires: timestamp('expires').notNull(),
})

// ── Auto-Entrepreneur Profile ─────────────────────────────────────────────────

export const entrepreneurs = pgTable('entrepreneurs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').unique().notNull().references(() => users.id, { onDelete: 'cascade' }),
  fullName: text('full_name').notNull(),
  // Identifiant Commun de l'Entreprise — 15 digits, mandatory since 2021 (CGI Article 145)
  ice: text('ice').unique().notNull(),
  // Identifiant Fiscal
  ifNumber: text('if_number').notNull(),
  activityType: activityTypeEnum('activity_type').notNull(),
  activityDescription: text('activity_description'),
  address: text('address').notNull(),
  city: text('city').notNull(),
  phone: text('phone'),
  bankIban: text('bank_iban'),
  registrationDate: date('registration_date').notNull(),
  // Each AE can customize their invoice prefix (e.g. 'FACT', 'INV', 'FAC')
  invoicePrefix: text('invoice_prefix').default('FACT').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// ── Clients ──────────────────────────────────────────────────────────────────

export const clients = pgTable('clients', {
  id: uuid('id').primaryKey().defaultRandom(),
  entrepreneurId: uuid('entrepreneur_id').notNull().references(() => entrepreneurs.id, {
    onDelete: 'cascade',
  }),
  name: text('name').notNull(),
  type: clientTypeEnum('type').notNull(),
  // ICE required for Moroccan B2B (mandatory since Jan 2019, CGI Article 145)
  ice: text('ice'),
  ifNumber: text('if_number'),
  email: text('email'),
  phone: text('phone'),
  address: text('address'),
  countryCode: text('country_code').default('MA').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// ── Invoices ─────────────────────────────────────────────────────────────────

export const invoices = pgTable(
  'invoices',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    entrepreneurId: uuid('entrepreneur_id').notNull().references(() => entrepreneurs.id),
    clientId: uuid('client_id').notNull().references(() => clients.id),
    // Sequential number — no gaps allowed (CGI Article 145)
    invoiceNumber: text('invoice_number').notNull(),
    fiscalYear: integer('fiscal_year').notNull(),
    sequenceNumber: integer('sequence_number').notNull(),
    issueDate: date('issue_date').notNull(),
    dueDate: date('due_date'),
    status: invoiceStatusEnum('status').default('draft').notNull(),
    paymentMethod: paymentMethodEnum('payment_method'),
    paymentDate: date('payment_date'),
    currency: text('currency').default('MAD').notNull(),
    // Exchange rate (MAD per unit of foreign currency) — required for foreign invoices
    // Source: Bank Al-Maghrib daily reference rate (bkam.ma)
    exchangeRate: numeric('exchange_rate', { precision: 10, scale: 4 }),
    subtotalOriginal: numeric('subtotal_original', { precision: 12, scale: 2 }).notNull(),
    subtotalMad: numeric('subtotal_mad', { precision: 12, scale: 2 }).notNull(),
    totalMad: numeric('total_mad', { precision: 12, scale: 2 }).notNull(),
    notes: text('notes'),
    pdfPath: text('pdf_path'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    // Enforce uniqueness of invoice numbers per entrepreneur
    unique('uq_invoice_number').on(t.entrepreneurId, t.invoiceNumber),
    unique('uq_invoice_sequence').on(t.entrepreneurId, t.fiscalYear, t.sequenceNumber),
    // Cap tracker query: all invoices for a client in a year (most frequent query)
    index('idx_invoices_client_year').on(t.clientId, t.fiscalYear),
    // Annual threshold query: paid invoices per entrepreneur per year
    index('idx_invoices_entrepreneur_year').on(t.entrepreneurId, t.fiscalYear),
  ]
)

// ── Invoice Lines ─────────────────────────────────────────────────────────────

export const invoiceLines = pgTable('invoice_lines', {
  id: uuid('id').primaryKey().defaultRandom(),
  invoiceId: uuid('invoice_id').notNull().references(() => invoices.id, { onDelete: 'cascade' }),
  position: integer('position').notNull(),
  description: text('description').notNull(),
  quantity: numeric('quantity', { precision: 10, scale: 3 }).notNull(),
  unitPriceOriginal: numeric('unit_price_original', { precision: 12, scale: 2 }).notNull(),
  lineTotalOriginal: numeric('line_total_original', { precision: 12, scale: 2 }).notNull(),
  lineTotalMad: numeric('line_total_mad', { precision: 12, scale: 2 }).notNull(),
})

// ── Quarterly Declarations ────────────────────────────────────────────────────

export const quarterlyDeclarations = pgTable(
  'quarterly_declarations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    entrepreneurId: uuid('entrepreneur_id').notNull().references(() => entrepreneurs.id),
    year: integer('year').notNull(),
    quarter: integer('quarter').notNull(),  // 1-4
    totalTurnoverMad: numeric('total_turnover_mad', { precision: 12, scale: 2 }).notNull(),
    // Tax rate at time of declaration (0.005 or 0.010) — stored for historical accuracy
    taxRate: numeric('tax_rate', { precision: 4, scale: 3 }).notNull(),
    taxDueMad: numeric('tax_due_mad', { precision: 12, scale: 2 }).notNull(),
    status: declarationStatusEnum('status').default('pending').notNull(),
    submittedAt: timestamp('submitted_at'),
    pdfPath: text('pdf_path'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    unique('uq_declaration_quarter').on(t.entrepreneurId, t.year, t.quarter),
  ]
)

// ── Relations ─────────────────────────────────────────────────────────────────

export const usersRelations = relations(users, ({ one }) => ({
  entrepreneur: one(entrepreneurs, {
    fields: [users.id],
    references: [entrepreneurs.userId],
  }),
}))

export const entrepreneursRelations = relations(entrepreneurs, ({ one, many }) => ({
  user: one(users, { fields: [entrepreneurs.userId], references: [users.id] }),
  clients: many(clients),
  invoices: many(invoices),
  declarations: many(quarterlyDeclarations),
}))

export const clientsRelations = relations(clients, ({ one, many }) => ({
  entrepreneur: one(entrepreneurs, {
    fields: [clients.entrepreneurId],
    references: [entrepreneurs.id],
  }),
  invoices: many(invoices),
}))

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  entrepreneur: one(entrepreneurs, {
    fields: [invoices.entrepreneurId],
    references: [entrepreneurs.id],
  }),
  client: one(clients, { fields: [invoices.clientId], references: [clients.id] }),
  lines: many(invoiceLines),
}))

export const invoiceLinesRelations = relations(invoiceLines, ({ one }) => ({
  invoice: one(invoices, { fields: [invoiceLines.invoiceId], references: [invoices.id] }),
}))
