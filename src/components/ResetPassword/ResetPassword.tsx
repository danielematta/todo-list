import styles from "./ResetPassword.module.css";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router";
import {
  passwordIsValid,
  confirmPasswordIsValid,
} from "../../validators/auth.validators";
import {
  type ResetPasswordErrorsTypes,
  isApiError,
} from "../../types/auth.types";
import { resetPassword } from "../../services/auth.service";
import Loader from "../Loader/Loader";
import { createPortal } from "react-dom";

const ResetPassword = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();
  const [resetPasswordValues, setResetPasswordValues] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [resetPasswordErrors, setResetPasswordErrors] =
    useState<ResetPasswordErrorsTypes>({
      newPassword: undefined,
      confirmPassword: undefined,
    });
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [resetPasswordFormError, setResetPasswordFormError] = useState<
    string | undefined
  >(undefined);
  const [isLoading, setIsLoading] = useState(false);

  const passwordVisibility = () => {
    setShowPassword((prevState) => !prevState);
  };

  const confirmPasswordVisibility = () => {
    setShowConfirmPassword((prevState) => !prevState);
  };

  const handleCancel = () => {
    navigate("/");
  };

  const handlePasswordValuesChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const { name, value } = e.target;

    setResetPasswordValues((prevState) => ({
      ...prevState,
      [name]: value,
    }));

    setResetPasswordErrors((prevState) => ({
      ...prevState,
      [name]: undefined,
    }));

    if (resetPasswordFormError) {
      setResetPasswordFormError(undefined);
    }
  };

  const handleResetPasswordSubmit = async (
    e: React.SubmitEvent<HTMLFormElement>,
  ) => {
    e.preventDefault();

    const newPasswordErrorMsg = passwordIsValid(
      resetPasswordValues.newPassword,
    );
    const confirmPasswordErrorMsg = confirmPasswordIsValid(
      resetPasswordValues.newPassword,
      resetPasswordValues.confirmPassword,
    );

    setResetPasswordErrors((prevState) => ({
      ...prevState,
      newPassword: newPasswordErrorMsg,
      confirmPassword: confirmPasswordErrorMsg,
    }));

    if (newPasswordErrorMsg || confirmPasswordErrorMsg || !token) {
      return;
    }
    const resetPasswordData = {
      token,
      newPassword: resetPasswordValues.newPassword,
    };

    setResetPasswordFormError(undefined);

    try {
      setIsLoading(true);
      await resetPassword(resetPasswordData);
      navigate("/reset-password-success");
    } catch (error) {
      if (isApiError(error)) {
        setResetPasswordFormError(error.message);
      } else {
        setResetPasswordFormError("Something went wrong. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.resetPasswordFormContainer}>
      <h1 className={styles.authTitle}>Password reset</h1>
      <h2 className={styles.authSubheading}>
        Enter a new password for your account.
      </h2>
      <form
        className={styles.resetPasswordForm}
        onSubmit={handleResetPasswordSubmit}
      >
        <div className={styles.inputPasswordContainer}>
          <input
            className={`${styles.inputPassword} ${resetPasswordErrors.newPassword && styles.inputPasswordError}`}
            type={showPassword ? "text" : "password"}
            id="newPassword"
            name="newPassword"
            placeholder="New password"
            onChange={handlePasswordValuesChange}
          />
          <button
            className={`${styles.button} ${styles.buttonShowPassword}`}
            type="button"
            onClick={passwordVisibility}
          >
            {showPassword ? (
              <EyeOff size={25} color="var(--text-placeholder)" />
            ) : (
              <Eye size={25} color="var(--text-placeholder)" />
            )}
          </button>
        </div>
        {resetPasswordErrors.newPassword && (
          <div className={styles.resetPasswordInputError}>
            {resetPasswordErrors.newPassword}
          </div>
        )}

        <div className={styles.inputPasswordContainer}>
          <input
            className={`${styles.inputPassword} ${resetPasswordErrors.confirmPassword && styles.inputPasswordError}`}
            type={showConfirmPassword ? "text" : "password"}
            id="confirmPassword"
            name="confirmPassword"
            placeholder="Confirm new password"
            onChange={handlePasswordValuesChange}
          />
          <button
            className={`${styles.button} ${styles.buttonShowPassword}`}
            type="button"
            onClick={confirmPasswordVisibility}
          >
            {showConfirmPassword ? (
              <EyeOff size={25} color="var(--text-placeholder)" />
            ) : (
              <Eye size={25} color="var(--text-placeholder)" />
            )}
          </button>
        </div>
        {resetPasswordErrors.confirmPassword && (
          <div className={styles.resetPasswordInputError}>
            {resetPasswordErrors.confirmPassword}
          </div>
        )}
        {resetPasswordFormError && (
          <div className={styles.resetPasswordFormError}>
            {resetPasswordFormError}
          </div>
        )}

        <div
          className={`${styles.buttonContainer} ${resetPasswordFormError && styles.buttonContainerWithError}`}
        >
          <button
            className={styles.cancelButton}
            type="button"
            onClick={handleCancel}
          >
            Cancel
          </button>
          <button
            className={styles.resetPasswordSubmit}
            type="submit"
            disabled={isLoading}
          >
            Send
          </button>
        </div>
      </form>
      {isLoading && createPortal(<Loader />, document.body)}
    </div>
  );
};

export default ResetPassword;
