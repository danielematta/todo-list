import styles from "./Modal.module.css";
import { type ModalPropsTypes } from "../../types/utility.types";

const Modal = ({
  isOpen,
  onClose,
  overlayClose,
  xButton,
  title,
  subheading,
  children,
}: ModalPropsTypes) => {
  if (!isOpen) return null;

  return (
    <div
      className={styles.overlay}
      onClick={overlayClose ? onClose : undefined}
    >
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {xButton ? <button className={styles.xButton} onClick={onClose}>X</button> : ""}
        <div className={styles.title}>{title}</div>
        <div className={styles.subheading}>{subheading}</div>
        {children}
      </div>
    </div>
  );
};

export default Modal;
