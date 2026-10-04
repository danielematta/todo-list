import { useState } from "react";
import styles from "./LoginForm.module.css";
import { useNavigate } from "react-router";
import {
  type LoginFormValuesTypes,
  type LoginFormErrorsTypes,
} from "../../types/auth.types.ts";
import { login } from "../../services/auth.service.ts";
import {
  emailIsValid,
  passwordIsEmpty,
} from "../../validators/auth.validators.ts";
import { isApiError } from "../../types/auth.types.ts";
import Loader from "../Loader/Loader.tsx";
import { Eye, EyeOff } from "lucide-react";
import { createPortal } from "react-dom";
import { useReduxDispatch } from "../../store/useRedux.ts";
import { setToken } from "../../reducers/tokenSlice.ts";
import { setIsAuthorized, setUser } from "../../reducers/userSlice.ts";

const LoginForm = () => {
  const navigate = useNavigate();
  const [loginFormValues, setLoginFormValues] = useState<LoginFormValuesTypes>({
    email: "",
    password: "",
  });
  const [loginFormErrors, setLoginFormErrors] = useState<LoginFormErrorsTypes>({
    email: undefined,
    password: undefined,
  });
  const [loginError, setLoginError] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const dispatch = useReduxDispatch();

  const handleLoginFormValuesChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const { name, value } = e.target;
    setLoginFormValues((prevState) => ({
      ...prevState,
      [name]: value,
    }));

    setLoginFormErrors((prevState) => ({
      ...prevState,
      [name]: undefined,
    }));

    if (loginError) {
      setLoginError(undefined);
    }
  };

  const handleLoginFormSubmit = async (
    e: React.SubmitEvent<HTMLFormElement>,
  ) => {
    e.preventDefault();

    const emailErrorMsg = emailIsValid(loginFormValues.email);
    const passwordErrorMsg = passwordIsEmpty(loginFormValues.password);

    setLoginFormErrors((prevState) => ({
      ...prevState,
      email: emailErrorMsg,
      password: passwordErrorMsg,
    }));

    if (emailErrorMsg || passwordErrorMsg) {
      return;
    }

    setLoginError(undefined);

    try {
      setIsLoading(true);
      const loginResponse = await login({
        email: loginFormValues.email,
        password: loginFormValues.password,
      });
      dispatch(setToken(loginResponse.token));
      dispatch(setUser(loginResponse.user));
      dispatch(setIsAuthorized(true));
      navigate("/activities");
    } catch (error) {
      if (isApiError(error)) {
        setLoginError(error.message);
      } else {
        setLoginError("Something went wrong. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    navigate("/forgot-password");
  };

  const passwordVisibility = () => {
    setShowPassword((prevState) => !prevState);
  };

  return (
    <div className={styles.formContainer}>
      <h1 className={styles.authTitle}>Enter your info to sign in</h1>
      <h2 className={styles.authSubheading}>
        or{" "}
        <button
          className={styles.authNavButton}
          onClick={() => navigate("/register")}
        >
          register
        </button>
      </h2>
      <form className={styles.loginForm} onSubmit={handleLoginFormSubmit}>
        <input
          className={`${styles.authInput} ${loginFormErrors.email && styles.authInputError}`}
          type="text"
          id="email"
          name="email"
          placeholder="E-mail"
          onChange={handleLoginFormValuesChange}
        />
        {loginFormErrors.email && (
          <div className={styles.loginFormInputError}>
            {loginFormErrors.email}
          </div>
        )}
        <div className={styles.inputPasswordContainer}>
          <input
            className={`${styles.authInput} ${loginFormErrors.password && styles.authInputError}`}
            type={showPassword ? "text" : "password"}
            id="password"
            name="password"
            placeholder="Password"
            onChange={handleLoginFormValuesChange}
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
        {loginFormErrors.password && (
          <div className={styles.loginFormInputError}>
            {loginFormErrors.password}
          </div>
        )}
        <button
          className={styles.forgotPasswordButton}
          type="button"
          onClick={handleForgotPassword}
        >
          Forgot password?
        </button>
        {loginError && (
          <div className={styles.loginFormError}>{loginError}</div>
        )}
        <button
          className={styles.loginSubmit}
          type="submit"
          disabled={isLoading}
        >
          Login
        </button>
      </form>
      {isLoading && createPortal(<Loader />, document.body)}
    </div>
  );
};

export default LoginForm;
