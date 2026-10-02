import styles from "./RegistrationForm.module.css";
import { useNavigate } from "react-router";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import {
  type RegistrationFormValuesTypes,
  type RegistrationFormErrorsTypes,
  type RegistrationResponseTypes,
  isApiError,
} from "../../types/auth.types";
import {
  usernameIsEmpty,
  emailIsValid,
  passwordIsValid,
} from "../../validators/auth.validators";
import { signup } from "../../services/auth.service";
import Modal from "../Modal/Modal";
import MockEmail from "../MockEmail/MockEmail";
import { createPortal } from "react-dom";
import Loader from "../Loader/Loader";

const RegistrationForm = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [registrationFormValues, setRegistrationFormValues] =
    useState<RegistrationFormValuesTypes>({
      name: "",
      email: "",
      password: "",
    });
  const [registrationFormErrors, setRegistrationFormErrors] =
    useState<RegistrationFormErrorsTypes>({
      name: undefined,
      email: undefined,
      password: undefined,
    });
  const [registrationError, setRegistrationError] = useState<
    string | undefined
  >(undefined);
  const [registrationResponse, setRegistrationResponse] =
    useState<RegistrationResponseTypes>();
  const [modalStatus, setModalStatus] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleRegistrationFormValuesChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const { name, value } = e.target;
    setRegistrationFormValues((prevState) => ({
      ...prevState,
      [name]: value,
    }));

    setRegistrationFormErrors((prevState) => ({
      ...prevState,
      [name]: undefined,
    }));

    if (registrationError) {
      setRegistrationError(undefined);
    }
  };

  const handleRegistrationFormSubmit = async (
    e: React.SubmitEvent<HTMLFormElement>,
  ) => {
    e.preventDefault();

    const usernameErrorMsg = usernameIsEmpty(registrationFormValues.name);
    const emailErrorMsg = emailIsValid(registrationFormValues.email);
    const passwordErrorMsg = passwordIsValid(registrationFormValues.password);

    setRegistrationFormErrors((prevState) => ({
      ...prevState,
      name: usernameErrorMsg,
      email: emailErrorMsg,
      password: passwordErrorMsg,
    }));

    if (usernameErrorMsg || emailErrorMsg || passwordErrorMsg) {
      return;
    }

    setRegistrationError(undefined);

    try {
      setIsLoading(true);
      const res = await signup(registrationFormValues);
      setRegistrationResponse(res);
      alert(res.message);
      setModalStatus(true);
    } catch (error) {
      if (isApiError(error)) {
        setRegistrationError(error.message);
      } else {
        setRegistrationError("Something went wrong. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const passwordVisibility = () => {
    setShowPassword((prevState) => !prevState);
  };

  const handleModalStatusChange = () => {
    setModalStatus((prevStatus) => !prevStatus);
  };

  return (
    <div className={styles.formContainer}>
      <h1 className={styles.authTitle}>Create an account</h1>
      <h2 className={styles.authSubheading}>
        or{" "}
        <button className={styles.authNavButton} onClick={() => navigate("/")}>
          sign in
        </button>
      </h2>
      <form
        className={styles.registrationForm}
        onSubmit={handleRegistrationFormSubmit}
      >
        <input
          className={`${styles.authInput} ${registrationFormErrors.name && styles.authInputError}`}
          type="text"
          id="name"
          name="name"
          placeholder="Username"
          onChange={handleRegistrationFormValuesChange}
        />
        {registrationFormErrors.name && (
          <div className={styles.registrationFormInputError}>
            {registrationFormErrors.name}
          </div>
        )}
        <input
          className={`${styles.authInput} ${registrationFormErrors.email && styles.authInputError} `}
          type="text"
          id="email"
          name="email"
          placeholder="E-mail"
          onChange={handleRegistrationFormValuesChange}
        />
        {registrationFormErrors.email && (
          <div className={styles.registrationFormInputError}>
            {registrationFormErrors.email}
          </div>
        )}
        <div className={styles.inputPasswordContainer}>
          <input
            className={`${styles.authInput} ${registrationFormErrors.password && styles.authInputError}`}
            type={showPassword ? "text" : "password"}
            id="password"
            name="password"
            placeholder="Password"
            onChange={handleRegistrationFormValuesChange}
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
        {registrationFormErrors.password && (
          <div className={styles.registrationFormInputError}>
            {registrationFormErrors.password}
          </div>
        )}
        {registrationError && (
          <div className={styles.registrationFormError}>
            {registrationError}
          </div>
        )}
        <button
          className={`${styles.registrationFormSubmit} ${registrationError && styles.registrationFormSubmitWithError}`}
          type="submit"
          disabled={isLoading}
        >
          Sign up
        </button>
      </form>
      {modalStatus &&
        registrationResponse &&
        createPortal(
          <Modal
            isOpen={modalStatus}
            onClose={handleModalStatusChange}
            overlayClose={false}
            xButton={true}
            title="Mailbox"
          >
            <MockEmail responseData={registrationResponse} />
          </Modal>,
          document.body,
        )}
      {isLoading && createPortal(<Loader />, document.body)}
    </div>
  );
};

export default RegistrationForm;
