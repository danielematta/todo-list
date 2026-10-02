import styles from "./ResetPasswordSuccessPage.module.css";
import { useNavigate } from "react-router";

const ResetPasswordSuccessPage = () => {
  const navigate = useNavigate();

  const toLogin = () => {
    navigate("/");
  }

  return (
    <div className={styles.resetPasswordSuccessPageContainer}>
      <h1 className={styles.authTitle}>Password reset successful</h1>
      <h2 className={styles.authSubheading}>
        Your password has been successfully updated. You can now sign in with your new password.
      </h2>
      <button className={styles.toLogin} onClick={toLogin}>Login</button>
    </div>
  );
};

export default ResetPasswordSuccessPage;
