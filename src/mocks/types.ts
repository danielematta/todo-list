export const TODO_STATUSES = [
    "active",
    "in_progress",
    "completed",
    "archived",
] as const;

export type TodoStatus = (typeof TODO_STATUSES)[number];

export interface User {
    id: string;
    email: string;
    password: string;
    name: string;
    activated: boolean;
    createdAt: string;
}

export type PublicUser = Omit<User, "password">;

export interface Todo {
    id: string;
    userId: string;
    name: string;
    description: string;
    dueDate: string | null;
    status: TodoStatus;
    deleted: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface Session {
    userId: string;
    expiresAt: number;
}

export interface ActivationToken {
    userId: string;
    expiresAt: number;
}

export interface ResetToken {
    userId: string;
    expiresAt: number;
}

export type MockEmailType = "activation" | "password-reset";

export interface MockEmail {
    id: string;
    type: MockEmailType;
    to: string;
    subject: string;
    token: string;
    userId: string;
    createdAt: string;
}

export type NewMockEmail = Omit<MockEmail, "id" | "createdAt">;

export interface MockDB {
    users: User[];
    todos: Todo[];
    tokens: Record<string, Session>;
    activationTokens: Record<string, ActivationToken>;
    resetTokens: Record<string, ResetToken>;
    mailbox: MockEmail[];
}

export interface AuthenticatedRequest {
    token: string;
    session: Session;
    user: User;
}

export type TodoSortField =
    | "createdAt"
    | "updatedAt"
    | "name"
    | "dueDate"
    | "status";

export type SortOrder = "asc" | "desc";

export interface TodoListPayload {
    status?: TodoStatus;
    search?: string;
    sort?: TodoSortField;
    order?: SortOrder;
}

export interface TodoIdPayload {
    id: string;
}

export interface CreateTodoPayload {
    name: string;
    description?: string;
    dueDate?: string | null;
}

export interface UpdateTodoPayload {
    id: string;
    name?: string;
    description?: string | null;
    dueDate?: string | null;
}

export interface TodoTransitionPayload {
    id: string;
    status: TodoStatus;
}

export interface TodoSuccess<T> {
    ok: true;
    data: T;
}

export interface TodoFailure {
    ok: false;
    status: number;
    error: string;
}

export type TodoActionResult<T> =
    | TodoSuccess<T>
    | TodoFailure;

export interface SocketData {
    token: string;
    user: User;
    expiresAt: number;
}

export interface ServerToClientEvents {
    connected: (data: {
        userId: string;
        expiresAt: number;
    }) => void;

    "auth:expired": (data: {
        reason: "token_expired";
        expiresAt: number;
    }) => void;

    "todo:created": (todo: Todo) => void;

    "todo:updated": (todo: Todo) => void;

    "todo:deleted": (data: {
        id: string;
    }) => void;
}

export interface ClientToServerEvents {
    "todos:list": (
        payload: TodoListPayload,
        ack: (response: TodoActionResult<Todo[]>) => void,
    ) => void;

    "todos:get": (
        payload: TodoIdPayload,
        ack: (response: TodoActionResult<Todo>) => void,
    ) => void;

    "todos:create": (
        payload: CreateTodoPayload,
        ack: (response: TodoActionResult<Todo>) => void,
    ) => void;

    "todos:update": (
        payload: UpdateTodoPayload,
        ack: (response: TodoActionResult<Todo>) => void,
    ) => void;

    "todos:complete": (
        payload: TodoIdPayload,
        ack: (response: TodoActionResult<Todo>) => void,
    ) => void;

    "todos:reopen": (
        payload: TodoIdPayload,
        ack: (response: TodoActionResult<Todo>) => void,
    ) => void;

    "todos:start": (
        payload: TodoIdPayload,
        ack: (response: TodoActionResult<Todo>) => void,
    ) => void;

    "todos:archive": (
        payload: TodoIdPayload,
        ack: (response: TodoActionResult<Todo>) => void,
    ) => void;

    "todos:delete": (
        payload: TodoIdPayload,
        ack: (
            response: TodoActionResult<{ id: string }>,
        ) => void,
    ) => void;
}