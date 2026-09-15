import fs from "node:fs";

import path from "node:path";

import { randomUUID } from "node:crypto";

import { fileURLToPath } from "node:url";

import {
  TODO_STATUSES,
  type ActivationToken,
  type MockDB,
  type MockEmail,
  type NewMockEmail,
  type ResetToken,
  type Session,
  type Todo,
  type User,
} from "./types";

export { TODO_STATUSES };

const __filename = fileURLToPath(import.meta.url);

const __dirname = path.dirname(__filename);

export const DB_PATH = path.resolve(
  __dirname,
  "../../.mock-db.json",
);

export const TOKEN_TTL = 60 * 60 * 1000;

export const ACTIVATION_TOKEN_TTL =
  24 * 60 * 60 * 1000;

export const RESET_TOKEN_TTL =
  60 * 60 * 1000;

export const DEFAULT_USERS: User[] = [
  {
    id: "user_001",
    email: "demo@test.com",
    password: "Password123_",
    name: "Demo User",
    activated: true,
    createdAt: "2025-01-01T00:00:00.000Z",
  },
];

export const DEFAULT_TODOS: Todo[] = [
  {
    id: "todo_001",
    userId: "user_001",
    name: "Completare il progetto",
    description:
      "Terminare il progetto mock backend.",
    dueDate: "2025-01-15",
    status: "active",
    deleted: false,
    createdAt: "2025-01-01T10:00:00.000Z",
    updatedAt: "2025-01-01T10:00:00.000Z",
  },
  {
    id: "todo_002",
    userId: "user_001",
    name: "Studiare Socket.IO",
    description:
      "Fare pratica con gli eventi realtime.",
    dueDate: "2025-01-20",
    status: "completed",
    deleted: false,
    createdAt: "2025-01-02T10:00:00.000Z",
    updatedAt: "2025-01-03T10:00:00.000Z",
  },
  {
    id: "todo_003",
    userId: "user_001",
    name: "Todo archiviato",
    description:
      "Todo utilizzato per testare l'archiviazione.",
    dueDate: null,
    status: "archived",
    deleted: false,
    createdAt: "2025-01-03T10:00:00.000Z",
    updatedAt: "2025-01-04T10:00:00.000Z",
  },
  {
    id: "todo_004",
    userId: "user_001",
    name: "Prova delete. Cancellami!!",
    description:
      "Todo utilizzato per testare la cancellazione.",
    dueDate: null,
    status: "archived",
    deleted: false,
    createdAt: "2025-01-04T10:00:00.000Z",
    updatedAt: "2025-01-04T10:00:00.000Z",
  },
];

function createDefaultDB(): MockDB {
  return {
    users: structuredClone(DEFAULT_USERS),
    todos: structuredClone(DEFAULT_TODOS),
    tokens: {},
    activationTokens: {},
    resetTokens: {},
    mailbox: [],
  };
}

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null
  );
}

function isUser(
  value: unknown,
): value is User {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === "string" &&
    typeof value.email === "string" &&
    typeof value.password === "string" &&
    typeof value.name === "string" &&
    typeof value.activated === "boolean" &&
    typeof value.createdAt === "string"
  );
}

function isTodo(
  value: unknown,
): value is Todo {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === "string" &&
    typeof value.userId === "string" &&
    typeof value.name === "string" &&
    typeof value.description === "string" &&
    (value.dueDate === null ||
      typeof value.dueDate === "string") &&
    typeof value.status === "string" &&
    TODO_STATUSES.includes(
      value.status as Todo["status"],
    ) &&
    typeof value.deleted === "boolean" &&
    typeof value.createdAt === "string" &&
    typeof value.updatedAt === "string"
  );
}

function isSession(
  value: unknown,
): value is Session {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.userId === "string" &&
    typeof value.expiresAt === "number" &&
    Number.isFinite(value.expiresAt)
  );
}

function isActivationToken(
  value: unknown,
): value is ActivationToken {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.userId === "string" &&
    typeof value.expiresAt === "number" &&
    Number.isFinite(value.expiresAt)
  );
}

function isResetToken(
  value: unknown,
): value is ResetToken {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.userId === "string" &&
    typeof value.expiresAt === "number" &&
    Number.isFinite(value.expiresAt)
  );
}

function isMockEmail(
  value: unknown,
): value is MockEmail {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === "string" &&
    (value.type === "activation" ||
      value.type === "password-reset") &&
    typeof value.to === "string" &&
    typeof value.subject === "string" &&
    typeof value.token === "string" &&
    typeof value.userId === "string" &&
    typeof value.createdAt === "string"
  );
}

function normalizeDB(
  input: unknown,
): MockDB {
  if (!isRecord(input)) {
    throw new Error(
      "The mock database has an invalid structure.",
    );
  }

  if (
    !Array.isArray(input.users) ||
    !input.users.every(isUser)
  ) {
    throw new Error(
      "The mock database has invalid users.",
    );
  }

  if (
    !Array.isArray(input.todos) ||
    !input.todos.every(isTodo)
  ) {
    throw new Error(
      "The mock database has invalid todos.",
    );
  }

  if (
    !isRecord(input.tokens) ||
    !Object.values(input.tokens).every(
      isSession,
    )
  ) {
    throw new Error(
      "The mock database has invalid sessions.",
    );
  }

  if (
    !isRecord(input.activationTokens) ||
    !Object.values(
      input.activationTokens,
    ).every(isActivationToken)
  ) {
    throw new Error(
      "The mock database has invalid activation tokens.",
    );
  }

  if (
    !isRecord(input.resetTokens) ||
    !Object.values(
      input.resetTokens,
    ).every(isResetToken)
  ) {
    throw new Error(
      "The mock database has invalid reset tokens.",
    );
  }

  if (
    !Array.isArray(input.mailbox) ||
    !input.mailbox.every(isMockEmail)
  ) {
    throw new Error(
      "The mock database has invalid mailbox entries.",
    );
  }

  return {
    users: input.users,
    todos: input.todos,
    tokens:
      input.tokens as Record<
        string,
        Session
      >,
    activationTokens:
      input.activationTokens as Record<
        string,
        ActivationToken
      >,
    resetTokens:
      input.resetTokens as Record<
        string,
        ResetToken
      >,
    mailbox: input.mailbox,
  };
}

export function loadDB(): MockDB {
  if (!fs.existsSync(DB_PATH)) {
    const freshDB = createDefaultDB();

    persistDB(freshDB);

    return freshDB;
  }

  try {
    const raw = fs.readFileSync(
      DB_PATH,
      "utf8",
    );

    if (!raw.trim()) {
      const freshDB = createDefaultDB();

      persistDB(freshDB);

      return freshDB;
    }

    return normalizeDB(
      JSON.parse(raw) as unknown,
    );
  } catch (error: unknown) {
    console.error(
      "Unable to read .mock-db.json:",
      error,
    );

    throw new Error(
      "The mock database is corrupted.",
      { cause: error },
    );
  }
}

export function persistDB(
  database: MockDB,
): void {
  const directory =
    path.dirname(DB_PATH);

  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, {
      recursive: true,
    });
  }

  const temporaryPath =
    `${DB_PATH}.tmp`;

  fs.writeFileSync(
    temporaryPath,
    JSON.stringify(
      database,
      null,
      2,
    ),
    "utf8",
  );

  fs.renameSync(
    temporaryPath,
    DB_PATH,
  );
}

export const db = loadDB();

export function persist(): void {
  persistDB(db);
}

export function resetDB(): void {
  const freshDB = createDefaultDB();

  db.users = freshDB.users;

  db.todos = freshDB.todos;

  db.tokens = freshDB.tokens;

  db.activationTokens =
    freshDB.activationTokens;

  db.resetTokens =
    freshDB.resetTokens;

  db.mailbox = freshDB.mailbox;

  persist();
}

export function generateId(
  prefix = "",
): string {
  return `${prefix}${randomUUID()}`;
}

export function createExpiry(
  ttl: number,
): number {
  return Date.now() + ttl;
}

export function isExpired(
  expiresAt: unknown,
): boolean {
  return (
    typeof expiresAt !== "number" ||
    !Number.isFinite(expiresAt) ||
    Date.now() >= expiresAt
  );
}

export function createToken(): string {
  return (
    `mock_token_` +
    randomUUID().replaceAll("-", "") +
    randomUUID().replaceAll("-", "")
  );
}

export function validatePassword(
  password: unknown,
): string | null {
  if (
    typeof password !== "string" ||
    password.length === 0
  ) {
    return "Password is required.";
  }

  if (password.length < 8) {
    return "Password must be at least 8 characters long.";
  }

  if (/\s/.test(password)) {
    return "Password cannot contain spaces.";
  }

  if (!/\d/.test(password)) {
    return "Password must contain at least one number.";
  }

  if (!/[^A-Za-z0-9]/.test(password)) {
    return "Password must contain at least one symbol.";
  }

  return null;
}

export function normalizeEmail(
  email: unknown,
): string {
  return typeof email === "string"
    ? email.trim().toLowerCase()
    : "";
}

export function normalizeName(
  name: unknown,
): string {
  return typeof name === "string"
    ? name.trim()
    : "";
}

export function validateEmail(
  email: string,
): boolean {
  return (
    email.length > 0 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      email,
    )
  );
}

export function validateDueDate(
  value: unknown,
): boolean {
  if (
    value === null ||
    value === undefined
  ) {
    return true;
  }

  if (typeof value !== "string") {
    return false;
  }

  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(
      value,
    )
  ) {
    return false;
  }

  const parts = value.split("-");

  if (parts.length !== 3) {
    return false;
  }

  const yearPart = parts[0];

  const monthPart = parts[1];

  const dayPart = parts[2];

  if (
    yearPart === undefined ||
    monthPart === undefined ||
    dayPart === undefined
  ) {
    return false;
  }

  const year = Number(yearPart);

  const month = Number(monthPart);

  const day = Number(dayPart);

  const date = new Date(
    Date.UTC(
      year,
      month - 1,
      day,
    ),
  );

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

export function getTokenSession(
  token: string,
): Session | null {
  if (!token) {
    return null;
  }

  const session = db.tokens[token];

  if (!session) {
    return null;
  }

  if (
    isExpired(session.expiresAt)
  ) {
    delete db.tokens[token];

    persist();

    return null;
  }

  return session;
}

export function getAuthenticatedUserFromToken(
  token: string,
): {
  user: User;
  session: Session;
} | null {
  const session =
    getTokenSession(token);

  if (!session) {
    return null;
  }

  const user = db.users.find(
    (item) =>
      item.id === session.userId,
  );

  if (!user) {
    delete db.tokens[token];

    persist();

    return null;
  }

  if (!user.activated) {
    return null;
  }

  return {
    user,
    session,
  };
}

export function getUserByEmail(
  email: string,
): User | undefined {
  const normalizedEmail =
    normalizeEmail(email);

  return db.users.find(
    (user) =>
      normalizeEmail(user.email) ===
      normalizedEmail,
  );
}

export function getUserById(
  userId: string,
): User | undefined {
  return db.users.find(
    (user) => user.id === userId,
  );
}

export function invalidateUserTokens(
  userId: string,
): boolean {
  let changed = false;

  for (
    const [token, session] of
    Object.entries(db.tokens)
  ) {
    if (
      session?.userId === userId
    ) {
      delete db.tokens[token];

      changed = true;
    }
  }

  if (changed) {
    persist();
  }

  return changed;
}

export function addMockEmail(
  email: NewMockEmail,
): void {
  db.mailbox.unshift({
    ...email,
    id: generateId("mail_"),
    createdAt:
      new Date().toISOString(),
  });

  db.mailbox =
    db.mailbox.slice(0, 20);

  persist();
}

export function cleanupExpiredTokens(): void {
  let changed = false;

  for (
    const [token, session] of
    Object.entries(db.tokens)
  ) {
    if (
      isExpired(session?.expiresAt)
    ) {
      delete db.tokens[token];

      changed = true;
    }
  }

  for (
    const [token, item] of
    Object.entries(
      db.activationTokens,
    )
  ) {
    if (
      isExpired(item?.expiresAt)
    ) {
      delete db.activationTokens[token];

      changed = true;
    }
  }

  for (
    const [token, item] of
    Object.entries(
      db.resetTokens,
    )
  ) {
    if (
      isExpired(item?.expiresAt)
    ) {
      delete db.resetTokens[token];

      changed = true;
    }
  }

  if (changed) {
    persist();
  }
}

cleanupExpiredTokens();