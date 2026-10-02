import {
  Server as SocketIOServer,
  type Socket,
} from "socket.io";

import {
  TODO_STATUSES,
  db,
  generateId,
  getTokenSession,
  getUserById,
  invalidateUserTokens,
  persist,
  validateDueDate,
} from "./db.ts";

import type {
  ClientToServerEvents,
  CreateTodoPayload,
  ServerToClientEvents,
  SocketData,
  Todo,
  TodoActionResult,
  TodoIdPayload,
  TodoListPayload,
  TodoStatus,
  TodoTransitionPayload,
  UpdateTodoPayload,
  User,
} from "./types.ts";

type SocketIOHttpServer =
  ConstructorParameters<
    typeof SocketIOServer
  >[0];

const VALID_TRANSITIONS: Record<
  TodoStatus,
  readonly TodoStatus[]
> = {
  active: [
    "in_progress",
    "completed",
    "archived",
  ],
  in_progress: [
    "active",
    "completed",
    "archived",
  ],
  completed: [
    "active",
    "archived",
  ],
  archived: [
    "active",
  ],
};

const ALLOWED_SORTS = [
  "createdAt",
  "updatedAt",
  "name",
  "dueDate",
  "status",
] as const;

type AllowedSort =
  (typeof ALLOWED_SORTS)[number];

type AppSocket = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  Record<string, never>,
  SocketData
>;

type AppSocketServer =
  SocketIOServer<
    ClientToServerEvents,
    ServerToClientEvents,
    Record<string, never>,
    SocketData
  >;

let ioInstance:
  AppSocketServer | null = null;

function fakeDelay(
  min = 150,
  max = 400,
): Promise<void> {
  const duration =
    Math.floor(
      Math.random() *
        (max - min + 1),
    ) + min;

  return new Promise(
    (resolve) => {
      setTimeout(
        resolve,
        duration,
      );
    },
  );
}

function normalizeString(
  value: unknown,
): string {
  return typeof value === "string"
    ? value.trim()
    : "";
}

function actionList(
  user: User,
  payload: TodoListPayload = {},
): TodoActionResult<Todo[]> {
  const {
    status,
    search,
    sort = "createdAt",
    order = "desc",
  } = payload;

  if (
    status !== undefined &&
    !TODO_STATUSES.includes(status)
  ) {
    return {
      ok: false,
      status: 400,
      error:
        "Invalid todo status.",
    };
  }

  const safeSort: AllowedSort =
    ALLOWED_SORTS.includes(sort)
      ? sort
      : "createdAt";

  const safeOrder =
    order === "asc"
      ? "asc"
      : "desc";

  let todos = db.todos.filter(
    (todo) =>
      todo.userId === user.id &&
      todo.deleted !== true,
  );

  if (status !== undefined) {
    todos = todos.filter(
      (todo) =>
        todo.status === status,
    );
  }

  if (search !== undefined) {
    const normalizedSearch =
      normalizeString(
        search,
      ).toLowerCase();

    todos = todos.filter(
      (todo) =>
        `${todo.name} ${todo.description}`
          .toLowerCase()
          .includes(
            normalizedSearch,
          ),
    );
  }

  todos.sort((a, b) => {
    const aValue =
      a[safeSort];

    const bValue =
      b[safeSort];

    if (aValue === bValue) {
      return 0;
    }

    if (
      aValue === null ||
      aValue === undefined
    ) {
      return safeOrder === "asc"
        ? -1
        : 1;
    }

    if (
      bValue === null ||
      bValue === undefined
    ) {
      return safeOrder === "asc"
        ? 1
        : -1;
    }

    let comparison: number;

    if (
      typeof aValue === "string" &&
      typeof bValue === "string"
    ) {
      comparison =
        aValue.localeCompare(
          bValue,
        );
    } else if (
      aValue > bValue
    ) {
      comparison = 1;
    } else {
      comparison = -1;
    }

    return safeOrder === "asc"
      ? comparison
      : -comparison;
  });

  return {
    ok: true,
    data: todos,
  };
}

function actionGet(
  user: User,
  payload: TodoIdPayload,
): TodoActionResult<Todo> {
  const todo =
    db.todos.find(
      (item) =>
        item.id === payload.id &&
        item.userId === user.id &&
        item.deleted !== true,
    );

  if (!todo) {
    return {
      ok: false,
      status: 404,
      error:
        "Todo not found.",
    };
  }

  return {
    ok: true,
    data: todo,
  };
}

function actionCreate(
  user: User,
  payload: CreateTodoPayload,
): TodoActionResult<Todo> {
  const name =
    normalizeString(
      payload.name,
    );

  const description =
    normalizeString(
      payload.description,
    );

  if (!name) {
    return {
      ok: false,
      status: 400,
      error:
        "Todo name is required.",
    };
  }

  if (
    !validateDueDate(
      payload.dueDate,
    )
  ) {
    return {
      ok: false,
      status: 400,
      error:
        "Invalid due date. Expected YYYY-MM-DD.",
    };
  }

  const now =
    new Date().toISOString();

  const todo: Todo = {
    id: generateId("todo_"),
    userId: user.id,
    name,
    description,
    dueDate:
      payload.dueDate ?? null,
    status: "active",
    deleted: false,
    createdAt: now,
    updatedAt: now,
  };

  db.todos.push(todo);

  persist();

  ioInstance
    ?.to(`user:${user.id}`)
    .emit(
      "todo:created",
      todo,
    );

  return {
    ok: true,
    data: todo,
  };
}

function actionUpdate(
  user: User,
  payload: UpdateTodoPayload,
): TodoActionResult<Todo> {
  const todo =
    db.todos.find(
      (item) =>
        item.id === payload.id &&
        item.userId === user.id &&
        item.deleted !== true,
    );

  if (!todo) {
    return {
      ok: false,
      status: 404,
      error:
        "Todo not found.",
    };
  }

  const hasName =
    Object.prototype.hasOwnProperty.call(
      payload,
      "name",
    );

  const hasDescription =
    Object.prototype.hasOwnProperty.call(
      payload,
      "description",
    );

  const hasDueDate =
    Object.prototype.hasOwnProperty.call(
      payload,
      "dueDate",
    );

  if (
    !hasName &&
    !hasDescription &&
    !hasDueDate
  ) {
    return {
      ok: false,
      status: 400,
      error:
        "No valid fields to update.",
    };
  }

  let nextName =
    todo.name;

  let nextDescription =
    todo.description;

  let nextDueDate =
    todo.dueDate;

  if (hasName) {
    const name =
      normalizeString(
        payload.name,
      );

    if (!name) {
      return {
        ok: false,
        status: 400,
        error:
          "Todo name cannot be empty.",
      };
    }

    nextName = name;
  }

  if (hasDescription) {
    if (
      payload.description ===
      null
    ) {
      nextDescription = "";
    } else if (
      typeof payload.description ===
      "string"
    ) {
      nextDescription =
        payload.description.trim();
    } else {
      return {
        ok: false,
        status: 400,
        error:
          "Description must be a string.",
      };
    }
  }

  if (hasDueDate) {
    if (
      !validateDueDate(
        payload.dueDate,
      )
    ) {
      return {
        ok: false,
        status: 400,
        error:
          "Invalid due date. Expected YYYY-MM-DD.",
      };
    }

    nextDueDate =
      payload.dueDate ?? null;
  }

  todo.name =
    nextName;

  todo.description =
    nextDescription;

  todo.dueDate =
    nextDueDate;

  todo.updatedAt =
    new Date().toISOString();

  persist();

  ioInstance
    ?.to(`user:${user.id}`)
    .emit(
      "todo:updated",
      todo,
    );

  return {
    ok: true,
    data: todo,
  };
}

function actionTransition(
  user: User,
  payload: TodoTransitionPayload,
): TodoActionResult<Todo> {
  const todo =
    db.todos.find(
      (item) =>
        item.id === payload.id &&
        item.userId === user.id &&
        item.deleted !== true,
    );

  if (!todo) {
    return {
      ok: false,
      status: 404,
      error:
        "Todo not found.",
    };
  }

  const targetStatus =
    payload.status;

  if (
    !TODO_STATUSES.includes(
      targetStatus,
    )
  ) {
    return {
      ok: false,
      status: 400,
      error:
        "Invalid todo status.",
    };
  }

  const allowedTransitions =
    VALID_TRANSITIONS[
      todo.status
    ];

  if (
    !allowedTransitions.includes(
      targetStatus,
    )
  ) {
    return {
      ok: false,
      status: 409,
      error:
        `Cannot change todo status from ` +
        `"${todo.status}" to ` +
        `"${targetStatus}".`,
    };
  }

  todo.status =
    targetStatus;

  todo.updatedAt =
    new Date().toISOString();

  persist();

  ioInstance
    ?.to(`user:${user.id}`)
    .emit(
      "todo:updated",
      todo,
    );

  return {
    ok: true,
    data: todo,
  };
}

function actionDelete(
  user: User,
  payload: TodoIdPayload,
): TodoActionResult<{
  id: string;
}> {
  const todo =
    db.todos.find(
      (item) =>
        item.id === payload.id &&
        item.userId === user.id &&
        item.deleted !== true,
    );

  if (!todo) {
    return {
      ok: false,
      status: 404,
      error:
        "Todo not found.",
    };
  }

  todo.deleted = true;

  todo.updatedAt =
    new Date().toISOString();

  persist();

  ioInstance
    ?.to(`user:${user.id}`)
    .emit(
      "todo:deleted",
      {
        id: todo.id,
      },
    );

  return {
    ok: true,
    data: {
      id: todo.id,
    },
  };
}

function authenticateSocket(
  socket: AppSocket,
): {
  token: string;
  session: NonNullable<
    ReturnType<
      typeof getTokenSession
    >
  >;
  user: User;
} | null {
  const token =
    socket.handshake.auth
      ?.accessToken;

  if (
    typeof token !== "string"
  ) {
    return null;
  }

  const session =
    getTokenSession(token);

  if (!session) {
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
    return null;
  }

  return {
    token,
    session,
    user,
  };
}

function getCurrentSocketAuth(
  socket: AppSocket,
): {
  token: string;
  session: NonNullable<
    ReturnType<
      typeof getTokenSession
    >
  >;
  user: User;
} | null {
  const token =
    socket.data.token;

  const session =
    getTokenSession(token);

  if (!session) {
    return null;
  }

  if (
    session.userId !==
    socket.data.user.id
  ) {
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
    return null;
  }

  return {
    token,
    session,
    user,
  };
}

async function handleSocketEvent<
  TPayload,
  TData,
>(
  socket: AppSocket,
  eventName: string,
  payload: TPayload,
  ack: (
    response: TodoActionResult<TData>,
  ) => void,
  action: (
    user: User,
    payload: TPayload,
  ) => TodoActionResult<TData>,
): Promise<void> {
  await fakeDelay();

  const auth =
    getCurrentSocketAuth(
      socket,
    );

  if (!auth) {
    ack({
      ok: false,
      status: 401,
      error: "Unauthorized.",
    });

    socket.disconnect(true);

    return;
  }

  try {
    const result =
      action(
        auth.user,
        payload,
      );

    ack(result);
  } catch (error: unknown) {
    console.error(
      `Socket event "${eventName}" failed:`,
      error,
    );

    ack({
      ok: false,
      status: 500,
      error:
        "Internal server error.",
    });
  }
}

export function attachSocketIO(
  httpServer: SocketIOHttpServer,
): AppSocketServer {
  if (ioInstance) {
    return ioInstance;
  }

  const io =
    createSocketServer(
      httpServer,
    );

  ioInstance = io;

  io.use(
    (socket, next) => {
      const auth =
        authenticateSocket(
          socket,
        );

      if (!auth) {
        next(
          new Error(
            "Unauthorized.",
          ),
        );

        return;
      }

      socket.data.token =
        auth.token;

      socket.data.user =
        auth.user;

      socket.data.expiresAt =
        auth.session.expiresAt;

      next();
    },
  );

  io.on(
    "connection",
    (socket) => {
      const user =
        socket.data.user;

      socket.join(
        `user:${user.id}`,
      );

      socket.emit(
        "connected",
        {
          userId: user.id,
          expiresAt:
            socket.data.expiresAt,
        },
      );

      const remaining =
        socket.data.expiresAt -
        Date.now();

      if (remaining <= 0) {
        socket.emit(
          "auth:expired",
          {
            reason:
              "token_expired",
            expiresAt:
              socket.data.expiresAt,
          },
        );

        socket.disconnect(true);

        return;
      }

      const timeout =
        setTimeout(
          () => {
            const session =
              getTokenSession(
                socket.data.token,
              );

            if (
              session &&
              session.userId ===
                socket.data.user.id
            ) {
              delete db.tokens[
                socket.data.token
              ];

              persist();
            }

            socket.emit(
              "auth:expired",
              {
                reason:
                  "token_expired",
                expiresAt:
                  socket.data.expiresAt,
              },
            );

            socket.disconnect(true);
          },
          remaining,
        );

      socket.on(
        "disconnect",
        () => {
          clearTimeout(timeout);
        },
      );

      socket.on(
        "todos:list",
        async (
          payload,
          ack,
        ) => {
          await handleSocketEvent(
            socket,
            "todos:list",
            payload,
            ack,
            actionList,
          );
        },
      );

      socket.on(
        "todos:get",
        async (
          payload,
          ack,
        ) => {
          await handleSocketEvent(
            socket,
            "todos:get",
            payload,
            ack,
            actionGet,
          );
        },
      );

      socket.on(
        "todos:create",
        async (
          payload,
          ack,
        ) => {
          await handleSocketEvent(
            socket,
            "todos:create",
            payload,
            ack,
            actionCreate,
          );
        },
      );

      socket.on(
        "todos:update",
        async (
          payload,
          ack,
        ) => {
          await handleSocketEvent(
            socket,
            "todos:update",
            payload,
            ack,
            actionUpdate,
          );
        },
      );

      socket.on(
        "todos:complete",
        async (
          payload,
          ack,
        ) => {
          await handleSocketEvent(
            socket,
            "todos:complete",
            payload,
            ack,
            (
              user,
              eventPayload,
            ) =>
              actionTransition(
                user,
                {
                  ...eventPayload,
                  status:
                    "completed",
                },
              ),
          );
        },
      );

      socket.on(
        "todos:reopen",
        async (
          payload,
          ack,
        ) => {
          await handleSocketEvent(
            socket,
            "todos:reopen",
            payload,
            ack,
            (
              user,
              eventPayload,
            ) =>
              actionTransition(
                user,
                {
                  ...eventPayload,
                  status:
                    "active",
                },
              ),
          );
        },
      );

      socket.on(
        "todos:start",
        async (
          payload,
          ack,
        ) => {
          await handleSocketEvent(
            socket,
            "todos:start",
            payload,
            ack,
            (
              user,
              eventPayload,
            ) =>
              actionTransition(
                user,
                {
                  ...eventPayload,
                  status:
                    "in_progress",
                },
              ),
          );
        },
      );

      socket.on(
        "todos:archive",
        async (
          payload,
          ack,
        ) => {
          await handleSocketEvent(
            socket,
            "todos:archive",
            payload,
            ack,
            (
              user,
              eventPayload,
            ) =>
              actionTransition(
                user,
                {
                  ...eventPayload,
                  status:
                    "archived",
                },
              ),
          );
        },
      );

      socket.on(
        "todos:delete",
        async (
          payload,
          ack,
        ) => {
          await handleSocketEvent(
            socket,
            "todos:delete",
            payload,
            ack,
            actionDelete,
          );
        },
      );
    },
  );

  return io;
}

function createSocketServer(
  httpServer: SocketIOHttpServer,
): AppSocketServer {
  return new SocketIOServer<
    ClientToServerEvents,
    ServerToClientEvents,
    Record<string, never>,
    SocketData
  >(
    httpServer,
    {
      cors: {
        origin: true,
        credentials: true,
      },
    },
  );
}

export function revokeToken(
  token: string,
): boolean {
  if (!token) {
    return false;
  }

  const existed =
    Boolean(db.tokens[token]);

  if (existed) {
    delete db.tokens[token];

    persist();
  }

  if (ioInstance) {
    for (
      const socket of
      ioInstance.sockets.sockets.values()
    ) {
      if (
        socket.data.token ===
        token
      ) {
        socket.disconnect(true);
      }
    }
  }

  return existed;
}

export function revokeUserTokens(
  userId: string,
): boolean {
  const changed =
    invalidateUserTokens(
      userId,
    );

  if (ioInstance) {
    for (
      const socket of
      ioInstance.sockets.sockets.values()
    ) {
      if (
        socket.data.user?.id ===
        userId
      ) {
        socket.disconnect(true);
      }
    }
  }

  return changed;
}