import { useState } from "react";
import styles from "./ForgotPassword.module.css";
import { emailIsValid } from "../../validators/auth.validators";
import { forgotPassword } from "../../services/auth.service";
import { useNavigate } from "react-router";
import Modal from "../Modal/Modal.tsx";
import { createPortal } from "react-dom";
import MockEmail from "../MockEmail/MockEmail.tsx";
import {
  isApiError,
  type ForgotPasswordResponseTypes,
} from "../../types/auth.types.ts";
import Loader from "../Loader/Loader.tsx";

const ForgotPassword = () => {
  const [emailValue, setEmailValue] = useState("");
  const [emailError, setEmailError] = useState<string | undefined>(undefined);
  const [forgotPasswordError, setForgotPasswordError] = useState<
    string | undefined
  >(undefined);
  const navigate = useNavigate();
  const [modalStatus, setModalStatus] = useState(false);
  const [forgotPasswordRes, setForgotPasswordRes] =
    useState<ForgotPasswordResponseTypes>();
  const [isLoading, setIsLoading] = useState(false);

  const handleEmailValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmailValue(e.target.value);

    if (emailError) {
      setEmailError(undefined);
    }

    if (forgotPasswordError) {
      setForgotPasswordError(undefined);
    }
  };

  const handleForgotPasswordSubmit = async (
    e: React.SubmitEvent<HTMLFormElement>,
  ) => {
    e.preventDefault();

    const emailErrorMsg = emailIsValid(emailValue);
    setEmailError(emailErrorMsg);

    if (emailErrorMsg) {
      return;
    }

    setForgotPasswordError(undefined);

    try {
      setIsLoading(true);
      const res = await forgotPassword(emailValue);
      setForgotPasswordRes(res);
      alert(res.message);
      setModalStatus(true);
    } catch (error) {
      if (isApiError(error)) {
        setForgotPasswordError(error.message);
      } else {
        setForgotPasswordError("Something went wrong. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    navigate("/");
  };

  const handleModalStatusChange = () => {
    setModalStatus((prevStatus) => !prevStatus);
  };

  return (
    <>
      <div className={styles.forgotPasswordFormContainer}>
        <h1 className={styles.authTitle}>Forgot password?</h1>
        <h2 className={styles.authSubheading}>
          Enter the email associated with your account, and we'll send you a
          link to reset your password.
        </h2>
        <form
          className={styles.forgotPasswordForm}
          onSubmit={handleForgotPasswordSubmit}
        >
          <input
            className={`${styles.emailInput} ${emailError && styles.emailInputError}`}
            type="text"
            id="email"
            name="email"
            placeholder="E-mail"
            onChange={handleEmailValueChange}
          />
          {emailError && (
            <div className={styles.emailInputError}>{emailError}</div>
          )}
          {forgotPasswordError && (
            <div className={styles.forgotPasswordError}>
              {forgotPasswordError}
            </div>
          )}
          <div
            className={`${styles.buttonContainer} ${forgotPasswordError && styles.buttonContainerWithError}`}
          >
            <button
              className={styles.cancelButton}
              type="button"
              onClick={handleCancel}
            >
              Cancel
            </button>
            <button
              className={styles.emailSubmit}
              type="submit"
              disabled={isLoading}
            >
              Send
            </button>
          </div>
        </form>
      </div>
      {modalStatus &&
        forgotPasswordRes &&
        createPortal(
          <Modal
            isOpen={modalStatus}
            onClose={handleModalStatusChange}
            overlayClose={false}
            xButton={true}
            title="Mailbox"
          >
            <MockEmail responseData={forgotPasswordRes} />
          </Modal>,
          document.body,
        )}
      {isLoading && createPortal(<Loader />, document.body)}
    </>
  );
};

export default ForgotPassword;
