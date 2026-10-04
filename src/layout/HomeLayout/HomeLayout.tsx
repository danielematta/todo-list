import styles from "./HomeLayout.module.css";
import { Outlet } from "react-router";
import Header from "../../components/Header/Header";

const HomeLayout = () => {
  return (
    <div className={styles.homeLayout}>
      <Header />
      <Outlet />
    </div>
  );
};

export default HomeLayout;
