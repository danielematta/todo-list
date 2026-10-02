import styles from "./AuthLayout.module.css";
import { Outlet } from "react-router";
import ToDoLogo from "../../assets/ToDoLogo.png";

const AuthLayout = () => {
  return (
    <div className={styles.authLayout}>
        <img className={styles.logo} src={ToDoLogo} alt="ToDo logo" />
      <div className={styles.authContainer}>
        <Outlet />
      </div>
    </div>
  );
};

export default AuthLayout;
