import styles from "./HomeLayout.module.css";
import ToDoLogo from "../../assets/ToDoLogo.png";

const HomeLayout = () => {
  return (
    <div className={styles.homeLayout}>
      <div className={styles.header}>
        <img className={styles.logo} src={ToDoLogo} alt="ToDo logo" />
      </div>
    </div>
  );
};

export default HomeLayout;
