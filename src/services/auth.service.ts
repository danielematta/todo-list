import {
  type LoginFormValuesTypes,
  type ApiErrorTypes,
  type LoginResponseTypes,
  type ForgotPasswordResponseTypes,
  type ResetPasswordValuesTypes,
  type ResetPasswordResponseTypes,
  type RegistrationFormValuesTypes,
  type RegistrationResponseTypes,
  type ActivateResponseTypes,
  type LogoutResponseTypes,
  type MeResponseTypes,
  type UpdateUsernameTypes,
} from "../types/auth.types.ts";

export const login = async (
  loginData: LoginFormValuesTypes,
): Promise<LoginResponseTypes> => {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(loginData),
  });

  const data = await res.json();

  if (!res.ok) {
    const error: ApiErrorTypes = {
      message: data.error,
      status: res.status,
    };
    throw error;
  }

  return data as LoginResponseTypes;
};

export const forgotPassword = async (
  email: string,
): Promise<ForgotPasswordResponseTypes> => {
  const res = await fetch("/api/auth/forgot-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

  const data = await res.json();

  if (!res.ok) {
    const error: ApiErrorTypes = {
      message: data.error,
      status: res.status,
    };
    throw error;
  }

  return data as ForgotPasswordResponseTypes;
};

export const resetPassword = async (
  resetPasswordData: ResetPasswordValuesTypes,
): Promise<ResetPasswordResponseTypes> => {
  const res = await fetch("/api/auth/reset-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(resetPasswordData),
  });

  const data = await res.json();

  if (!res.ok) {
    const error: ApiErrorTypes = {
      message: data.error,
      status: res.status,
    };
    throw error;
  }

  return data as ResetPasswordResponseTypes;
};

export const signup = async (
  registrationData: RegistrationFormValuesTypes,
): Promise<RegistrationResponseTypes> => {
  const res = await fetch("/api/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(registrationData),
  });

  const data = await res.json();

  if (!res.ok) {
    const error: ApiErrorTypes = {
      message: data.error,
      status: res.status,
    };
    throw error;
  }

  return data as RegistrationResponseTypes;
};

export const activate = async (
  token: string,
): Promise<ActivateResponseTypes> => {
  const res = await fetch("/api/auth/activate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  });

  const data = await res.json();

  if (!res.ok) {
    const error: ApiErrorTypes = {
      message: data.error,
      status: res.status,
    };
    throw error;
  }

  return data as ActivateResponseTypes;
};

export const logout = async (token: string): Promise<LogoutResponseTypes> => {
  const res = await fetch("/api/auth/logout", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await res.json();

  if (!res.ok) {
    const error: ApiErrorTypes = {
      message: data.error,
      status: res.status,
    };
    throw error;
  }

  return data as LogoutResponseTypes;
};

export const me = async (token: string): Promise<MeResponseTypes> => {
  const res = await fetch("/api/auth/me", {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await res.json();

  if (!res.ok) {
    const error: ApiErrorTypes = {
      message: data.error,
      status: res.status,
    };
    throw error;
  }

  return data as MeResponseTypes;
};

export const updateUsername = async ({
  name,
  token,
}: {
  name: string;
  token: string;
}): Promise<UpdateUsernameTypes> => {
  const res = await fetch("/api/auth/profile", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ name }),
  });

  const data = await res.json();

  if (!res.ok) {
    const error: ApiErrorTypes = {
      message: data.error,
      status: res.status,
    };
    throw error;
  }

  return data as UpdateUsernameTypes;
};
