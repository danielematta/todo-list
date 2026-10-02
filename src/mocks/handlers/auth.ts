import {
  http,
  HttpResponse,
} from "msw";

const FAKE_DELAY_MIN = 200;
const FAKE_DELAY_MAX = 600;

interface ProxyOptions {
  method?: "GET" | "POST";
  body?: unknown;
  request?: Request;
}

function fakeDelay(): Promise<void> {
  const duration =
    Math.floor(
      Math.random() *
        (FAKE_DELAY_MAX -
          FAKE_DELAY_MIN +
          1),
    ) + FAKE_DELAY_MIN;

  return new Promise((resolve) => {
    setTimeout(resolve, duration);
  });
}

async function proxyRequest(
  endpoint: string,
  options: ProxyOptions = {},
): Promise<Response> {
  await fakeDelay();

  const headers = new Headers();

  if (options.body !== undefined) {
    headers.set(
      "Content-Type",
      "application/json",
    );
  }

  const authorization =
    options.request?.headers.get(
      "authorization",
    );

  if (authorization) {
    headers.set(
      "Authorization",
      authorization,
    );
  }

  const init: RequestInit = {
    method: options.method ?? "POST",
    headers,
  };

  if (options.body !== undefined) {
    init.body = JSON.stringify(
      options.body,
    );
  }

  const response = await fetch(
    endpoint,
    init,
  );

  let data: Record<string, unknown> = {
    error:
      "Invalid backend response.",
  };

  try {
    const parsed: unknown =
      await response.json();

    if (
      typeof parsed === "object" &&
      parsed !== null &&
      !Array.isArray(parsed)
    ) {
      data =
        parsed as Record<
          string,
          unknown
        >;
    }
  } catch {
    // Keep the fallback response.
  }

  return HttpResponse.json(
    data,
    {
      status: response.status,
    },
  );
}

export const authHandlers = [
  http.post(
    "/api/auth/signup",
    async ({ request }) => {
      const body: unknown =
        await request.json();

      return proxyRequest(
        "/__mock/auth/signup",
        {
          method: "POST",
          body,
        },
      );
    },
  ),

  http.post(
    "/api/auth/activate",
    async ({ request }) => {
      const body: unknown =
        await request.json();

      return proxyRequest(
        "/__mock/auth/activate",
        {
          method: "POST",
          body,
        },
      );
    },
  ),

  http.post(
    "/api/auth/login",
    async ({ request }) => {
      const body: unknown =
        await request.json();

      return proxyRequest(
        "/__mock/auth/login",
        {
          method: "POST",
          body,
        },
      );
    },
  ),

  http.post(
    "/api/auth/logout",
    async ({ request }) =>
      proxyRequest(
        "/__mock/auth/logout",
        {
          method: "POST",
          request,
        },
      ),
  ),

  http.get(
    "/api/auth/me",
    async ({ request }) =>
      proxyRequest(
        "/__mock/auth/me",
        {
          method: "GET",
          request,
        },
      ),
  ),

  http.post(
    "/api/auth/forgot-password",
    async ({ request }) => {
      const body: unknown =
        await request.json();

      return proxyRequest(
        "/__mock/auth/forgot-password",
        {
          method: "POST",
          body,
        },
      );
    },
  ),

  http.post(
    "/api/auth/reset-password",
    async ({ request }) => {
      const body: unknown =
        await request.json();

      return proxyRequest(
        "/__mock/auth/reset-password",
        {
          method: "POST",
          body,
        },
      );
    },
  ),
];