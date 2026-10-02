export const emailIsValid = (emailValue: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  if (emailValue.length < 1) {
    return "E-mail is required";
  }

  if (!emailRegex.test(emailValue)) {
    return "Invalid e-mail address";
  }

  return undefined;
};

export const passwordIsEmpty = (passwordValue: string) => {
  if (passwordValue.length < 1) {
    return "Password is required";
  }
  return undefined;
};

export const passwordIsValid = (passwordValue: string) => {
  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9\s])\S{8,}$/;

  if (passwordValue.length < 1) {
    return "Password is required";
  }

  if (!passwordRegex.test(passwordValue)) {
    return "Password must be at least 8 characters and include at least one uppercase letter, one lowercase letter, one number and one symbol, with no spaces.";
  }

  return undefined;
};

export const confirmPasswordIsValid = (
  newPassword: string,
  confirmPassword: string,
) => {
  if (confirmPassword.length < 1) {
    return "Field is required";
  }

  if (newPassword !== confirmPassword) {
    return "Passwords do not match.";
  }

  return undefined;
};

export const usernameIsEmpty = (usernameValue: string) => {
  if (usernameValue.length < 1) {
    return "Username is required";
  }
  return undefined;
};
