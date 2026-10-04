export type LoginFormValuesTypes = {
  email: string;
  password: string;
};

export type LoginFormErrorsTypes = {
  email: string | undefined;
  password: string | undefined;
};

export type ApiErrorTypes = {
  message: string;
  status: number;
};

export type AuthUserTypes = {
  id: string;
  email: string;
  name: string;
  activated: boolean;
  createdAt: string;
};

export type LoginResponseTypes = {
  token: string;
  expiresIn: number;
  expiresAt: number;
  user: AuthUserTypes;
};

export type ForgotPasswordResponseTypes = {
  message: string;
  mockEmail?: {
    type: "password-reset";
    to: string;
    recipientName: string;
    subject: string;
    token: string;
  };
};

export type ResetPasswordValuesTypes = {
  token: string;
  newPassword: string;
};

export type ResetPasswordResponseTypes = {
  message: string;
};

export type ResetPasswordErrorsTypes = {
  newPassword: string | undefined;
  confirmPassword: string | undefined;
};

export type RegistrationFormValuesTypes = {
  name: string;
  email: string;
  password: string;
};

export type RegistrationFormErrorsTypes = {
  name: string | undefined;
  email: string | undefined;
  password: string | undefined;
};

export type RegistrationResponseTypes = {
  message: string;
  user: AuthUserTypes;
  mockEmail: {
    type: "activation";
    to: string;
    recipientName: string;
    subject: string;
    token: string;
  };
};

export type ActivateResponseTypes = {
  message: string;
};

export type LogoutResponseTypes = {
  message: string;
};

export type MeResponseTypes = {
  user: AuthUserTypes;
};

export type UpdateUsernameTypes = {
  user: AuthUserTypes;
}

//TYPE GUARDS

export const isApiError = (error: unknown): error is ApiErrorTypes => {
  return (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string" &&
    "status" in error &&
    typeof error.status === "number"
  );
};