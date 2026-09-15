import type {
  IncomingMessage,
  ServerResponse,
} from "node:http";

import {
  ACTIVATION_TOKEN_TTL,
  RESET_TOKEN_TTL,
  TOKEN_TTL,
  addMockEmail,
  createExpiry,
  createToken,
  db,
  generateId,
  getUserByEmail,
  getUserById,
  invalidateUserTokens,
  isExpired,
  normalizeEmail,
  normalizeName,
  persist,
  validateEmail,
  validatePassword,
} from "./db";

import {
  revokeToken,
} from "./socketServer";

import type {
  AuthenticatedRequest,
  PublicUser,
  User,
} from "./types";

type JsonObject =
  Record<string, unknown>;

interface RequestBodyOptions {
  maxBytes?: number;
}

function isJsonObject(
  value: unknown,
): value is JsonObject {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function sendJSON<T>(
  res: ServerResponse,
  status: number,
  data: T,
): void {
  res.statusCode = status;

  res.setHeader(
    "Content-Type",
    "application/json; charset=utf-8",
  );

  res.end(
    JSON.stringify(data),
  );
}

function readRequestBody(
  req: IncomingMessage,
  options: RequestBodyOptions = {},
): Promise<JsonObject> {
  const maxBytes =
    options.maxBytes ??
    1024 * 1024;

  return new Promise(
    (resolve, reject) => {
      let body = "";

      req.on(
        "data",
        (chunk: Buffer | string) => {
          body += chunk.toString();

          if (
            body.length > maxBytes
          ) {
            reject(
              new Error(
                "Request body too large.",
              ),
            );

            req.destroy();
          }
        },
      );

      req.on("end", () => {
        if (!body.trim()) {
          resolve({});
          return;
        }

        try {
          const parsed: unknown =
            JSON.parse(body);

          if (
            !isJsonObject(parsed)
          ) {
            reject(
              new Error(
                "Request body must be a JSON object.",
              ),
            );

            return;
          }

          resolve(parsed);
        } catch {
          reject(
            new Error(
              "Invalid JSON.",
            ),
          );
        }
      });

      req.on(
        "error",
        reject,
      );
    },
  );
}

function getBearerToken(
  req: IncomingMessage,
): string | null {
  const header =
    req.headers.authorization;

  if (
    typeof header !== "string"
  ) {
    return null;
  }

  if (
    !header.startsWith(
      "Bearer ",
    )
  ) {
    return null;
  }

  return (
    header
      .slice("Bearer ".length)
      .trim() || null
  );
}

function authenticateRequest(
  req: IncomingMessage,
): AuthenticatedRequest | null {
  const token =
    getBearerToken(req);

  if (!token) {
    return null;
  }

  const session =
    db.tokens[token];

  if (
    !session ||
    isExpired(session.expiresAt)
  ) {
    if (session) {
      delete db.tokens[token];
      persist();
    }

    return null;
  }

  const user =
    getUserById(
      session.userId,
    );

  if (
    !user ||
    !user.activated
  ) {
    delete db.tokens[token];
    persist();

    return null;
  }

  return {
    token,
    session,
    user,
  };
}

function toPublicUser(
  user: User,
): PublicUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    activated: user.activated,
    createdAt: user.createdAt,
  };
}

async function signup(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  const body =
    await readRequestBody(req);

  const email =
    normalizeEmail(body.email);

  const password =
    body.password;

  const name =
    normalizeName(body.name);

  if (
    !email ||
    typeof password !== "string" ||
    !name
  ) {
    sendJSON(res, 400, {
      error:
        "Email, password and name are required.",
    });

    return;
  }

  if (!validateEmail(email)) {
    sendJSON(res, 400, {
      error:
        "Invalid email address.",
    });

    return;
  }

  const passwordError =
    validatePassword(password);

  if (passwordError) {
    sendJSON(res, 400, {
      error: passwordError,
    });

    return;
  }

  if (getUserByEmail(email)) {
    sendJSON(res, 409, {
      error:
        "An account with this email already exists.",
    });

    return;
  }

  const user: User = {
    id: generateId("user_"),
    email,
    password,
    name,
    activated: false,
    createdAt:
      new Date().toISOString(),
  };

  db.users.push(user);

  const activationToken =
    generateId("activation_");

  db.activationTokens[
    activationToken
  ] = {
    userId: user.id,
    expiresAt: createExpiry(
      ACTIVATION_TOKEN_TTL,
    ),
  };

  addMockEmail({
    type: "activation",
    to: user.email,
    subject:
      "Activate your account",
    token: activationToken,
    userId: user.id,
  });

  sendJSON(res, 201, {
    message:
      "Account created. Please activate your account.",
    user: toPublicUser(user),
  });
}

async function activate(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  const body =
    await readRequestBody(req);

  const token =
    typeof body.token === "string"
      ? body.token.trim()
      : "";

  if (!token) {
    sendJSON(res, 400, {
      error:
        "Activation token is required.",
    });

    return;
  }

  const activation =
    db.activationTokens[token];

  if (!activation) {
    sendJSON(res, 400, {
      error:
        "Invalid activation token.",
    });

    return;
  }

  if (
    isExpired(
      activation.expiresAt,
    )
  ) {
    delete db.activationTokens[
      token
    ];

    persist();

    sendJSON(res, 400, {
      error:
        "Activation token has expired.",
    });

    return;
  }

  const user =
    getUserById(
      activation.userId,
    );

  if (!user) {
    delete db.activationTokens[
      token
    ];

    persist();

    sendJSON(res, 400, {
      error: "User not found.",
    });

    return;
  }

  if (user.activated) {
    delete db.activationTokens[
      token
    ];

    persist();

    sendJSON(res, 400, {
      error:
        "Account is already activated.",
    });

    return;
  }

  user.activated = true;

  delete db.activationTokens[
    token
  ];

  persist();

  sendJSON(res, 200, {
    message:
      "Account activated successfully.",
  });
}

async function login(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  const body =
    await readRequestBody(req);

  const email =
    normalizeEmail(body.email);

  const password =
    body.password;

  if (
    !email ||
    typeof password !== "string"
  ) {
    sendJSON(res, 400, {
      error:
        "Email and password are required.",
    });

    return;
  }

  const user =
    getUserByEmail(email);

  if (
    !user ||
    user.password !== password
  ) {
    sendJSON(res, 401, {
      error:
        "Invalid email or password.",
    });

    return;
  }

  if (!user.activated) {
    sendJSON(res, 403, {
      error:
        "Account is not activated.",
    });

    return;
  }

  const token =
    createToken();

  const expiresAt =
    createExpiry(TOKEN_TTL);

  db.tokens[token] = {
    userId: user.id,
    expiresAt,
  };

  persist();

  sendJSON(res, 200, {
    token,
    expiresIn:
      TOKEN_TTL / 1000,
    expiresAt,
    user: toPublicUser(user),
  });
}

async function logout(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  const token =
    getBearerToken(req);

  if (token) {
    revokeToken(token);
  }

  sendJSON(res, 200, {
    message: "Logged out.",
  });
}

async function me(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  const auth =
    authenticateRequest(req);

  if (!auth) {
    sendJSON(res, 401, {
      error: "Unauthorized.",
    });

    return;
  }

  sendJSON(res, 200, {
    user: toPublicUser(
      auth.user,
    ),
  });
}

async function forgotPassword(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  const body =
    await readRequestBody(req);

  const email =
    normalizeEmail(body.email);

  const genericMessage =
    "If the account exists, a reset email has been sent.";

  if (
    !email ||
    !validateEmail(email)
  ) {
    sendJSON(res, 200, {
      message: genericMessage,
    });

    return;
  }

  const user =
    getUserByEmail(email);

  if (!user) {
    sendJSON(res, 200, {
      message: genericMessage,
    });

    return;
  }

  for (
    const [token, item] of
    Object.entries(
      db.resetTokens,
    )
  ) {
    if (
      item?.userId === user.id
    ) {
      delete db.resetTokens[
        token
      ];
    }
  }

  const resetToken =
    generateId("reset_");

  db.resetTokens[
    resetToken
  ] = {
    userId: user.id,
    expiresAt: createExpiry(
      RESET_TOKEN_TTL,
    ),
  };

  addMockEmail({
    type: "password-reset",
    to: user.email,
    subject:
      "Reset your password",
    token: resetToken,
    userId: user.id,
  });

  sendJSON(res, 200, {
    message: genericMessage,
  });
}

async function resetPassword(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  const body =
    await readRequestBody(req);

  const token =
    typeof body.token === "string"
      ? body.token.trim()
      : "";

  const newPassword =
    body.newPassword;

  if (
    !token ||
    typeof newPassword !== "string"
  ) {
    sendJSON(res, 400, {
      error:
        "Reset token and new password are required.",
    });

    return;
  }

  const passwordError =
    validatePassword(
      newPassword,
    );

  if (passwordError) {
    sendJSON(res, 400, {
      error: passwordError,
    });

    return;
  }

  const reset =
    db.resetTokens[token];

  if (!reset) {
    sendJSON(res, 400, {
      error:
        "Invalid reset token.",
    });

    return;
  }

  if (
    isExpired(
      reset.expiresAt,
    )
  ) {
    delete db.resetTokens[
      token
    ];

    persist();

    sendJSON(res, 400, {
      error:
        "Reset token has expired.",
    });

    return;
  }

  const user =
    getUserById(
      reset.userId,
    );

  if (!user) {
    delete db.resetTokens[
      token
    ];

    persist();

    sendJSON(res, 400, {
      error: "User not found.",
    });

    return;
  }

  user.password =
    newPassword;

  delete db.resetTokens[
    token
  ];

  invalidateUserTokens(
    user.id,
  );

  persist();

  sendJSON(res, 200, {
    message:
      "Password reset successfully.",
  });
}

async function mailbox(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  if (req.method === "GET") {
    sendJSON(res, 200, {
      emails: db.mailbox,
    });

    return;
  }

  if (req.method === "DELETE") {
    db.mailbox = [];

    persist();

    sendJSON(res, 200, {
      message:
        "Mailbox cleared.",
    });

    return;
  }

  sendJSON(res, 405, {
    error:
      "Method not allowed.",
  });
}

export async function handleMockBackend(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<boolean> {
  const url = new URL(
    req.url ?? "/",
    "http://localhost",
  );

  try {
    if (
      url.pathname ===
        "/__mock/auth/signup" &&
      req.method === "POST"
    ) {
      await signup(req, res);
      return true;
    }

    if (
      url.pathname ===
        "/__mock/auth/activate" &&
      req.method === "POST"
    ) {
      await activate(req, res);
      return true;
    }

    if (
      url.pathname ===
        "/__mock/auth/login" &&
      req.method === "POST"
    ) {
      await login(req, res);
      return true;
    }

    if (
      url.pathname ===
        "/__mock/auth/logout" &&
      req.method === "POST"
    ) {
      await logout(req, res);
      return true;
    }

    if (
      url.pathname ===
        "/__mock/auth/me" &&
      req.method === "GET"
    ) {
      await me(req, res);
      return true;
    }

    if (
      url.pathname ===
        "/__mock/auth/forgot-password" &&
      req.method === "POST"
    ) {
      await forgotPassword(
        req,
        res,
      );

      return true;
    }

    if (
      url.pathname ===
        "/__mock/auth/reset-password" &&
      req.method === "POST"
    ) {
      await resetPassword(
        req,
        res,
      );

      return true;
    }

    if (
      url.pathname ===
      "/__mock/mailbox"
    ) {
      await mailbox(req, res);
      return true;
    }

    return false;
  } catch (error: unknown) {
    console.error(
      "Mock backend error:",
      error,
    );

    if (!res.headersSent) {
      sendJSON(res, 500, {
        error:
          error instanceof Error
            ? error.message
            : "Internal server error.",
      });
    }

    return true;
  }
}