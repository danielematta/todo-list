import { LoaderCircle } from "lucide-react";
import styles from "./Loader.module.css";

const Loader = () => {
  return (
    <div className={styles.overlay}>
      <LoaderCircle
        className={styles.loader}
        size={80}
        color={"var(--text-primary)"}
      />
    </div>
  );
};

export default Loader;
