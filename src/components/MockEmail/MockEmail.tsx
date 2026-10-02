import styles from "./MockEmail.module.css";
import {
  type ForgotPasswordResponseTypes,
  type RegistrationResponseTypes,
} from "../../types/auth.types";

const MockEmail = ({
  responseData: responseData,
}: {
  responseData: ForgotPasswordResponseTypes | RegistrationResponseTypes;
}) => {
  let body: React.ReactNode = null;

  if (!responseData.mockEmail) {
    return (
      <div className={styles.mailboxContainer}>
        <div className={styles.noEmail}>No e-mail received.</div>
      </div>
    );
  }

  const {
    subject: mailSubject,
    to: mailTo,
    recipientName: mailUserName,
    token: mailToken,
    type,
  } = responseData.mockEmail;

  if (responseData.mockEmail && type === "password-reset") {
    body = (
      <>
        <div className={styles.body}>
          Hi {mailUserName},
          <br />
          We received a request to reset your password.
          <br />
          Click the button below to choose a new one:
          <br />
          <a
            className={styles.resetPasswordLink}
            href={`/reset-password?token=${mailToken}`}
          >
            Reset password
          </a>
        </div>
        <div className={styles.regards}>
          Thanks,
          <br />
          The ToDo Team
        </div>
      </>
    );
  } else if (responseData.mockEmail && type === "activation") {
    body = (
      <>
        <div className={styles.body}>
          Hi {mailUserName},
          <br />
          Thanks for signing up!
          <br />
          Please confirm your email address by clicking the button below:
          <br />
          <a
            className={styles.resetPasswordLink}
            href={`/activation?token=${mailToken}`}
          >
            Verify email
          </a>
        </div>
        <div className={styles.regards}>
          Thanks,
          <br />
          The ToDo Team
        </div>
      </>
    );
  }

  return (
    <div className={styles.mailboxContainer}>
      <div className={styles.subject}>{mailSubject}</div>
      <div className={styles.recipient}>To: {mailTo}</div>
      {body}
    </div>
  );
};

export default MockEmail;
