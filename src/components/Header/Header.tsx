import styles from "./Header.module.css";
import ToDoLogo from "../../assets/ToDoLogo.png";
import { useReduxSelector, useReduxDispatch } from "../../store/useRedux";
import {
  clearUser,
  setIsAuthorized,
  userSelector,
} from "../../reducers/userSlice";
import ProfileDropdownMenu from "../ProfileDropdownMenu/ProfileDropdownMenu";
import { logout } from "../../services/auth.service";
import { clearToken, tokenSelector } from "../../reducers/tokenSlice";
import { isApiError } from "../../types/auth.types";
import { useState } from "react";
import { createPortal } from "react-dom";
import Loader from "../Loader/Loader";
import Modal from "../Modal/Modal";
import ChangeUsername from "../ChangeUsername/ChangeUsername";

const Header = () => {
  const token = useReduxSelector(tokenSelector);
  const user = useReduxSelector(userSelector);
  const dispatch = useReduxDispatch();
  const [logoutError, setLogoutError] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [changeUsernameModalStatus, setChangeUsernameModalStatus] = useState(false);

  const handleLogout = async () => {
    if (token) {
      try {
        setIsLoading(true);
        await logout(token);
        dispatch(clearToken());
        dispatch(clearUser());
        dispatch(setIsAuthorized(false));
      } catch (error) {
        if (isApiError(error)) {
          setLogoutError(error.message);
          alert(error.message);
        } else {
          setLogoutError("Something went wrong. Please try again.");
          alert("Something went wrong. Please try again.");
        }
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleChangeUsernameModalStatus = () => {
    setChangeUsernameModalStatus((prevState) => !prevState);
  }

  return (
    <div className={styles.header}>
      <img className={styles.logo} src={ToDoLogo} alt="ToDo logo" />
      <div className={styles.rightContainer}>
        <div className={styles.nameContainer}>
          <div>Hi</div>
          <ProfileDropdownMenu
            name={user.user?.name}
            logout={handleLogout}
            updateUsername={handleChangeUsernameModalStatus}
          />
        </div>
      </div>
      {changeUsernameModalStatus &&
        createPortal(
          <Modal
            isOpen={changeUsernameModalStatus}
            onClose={handleChangeUsernameModalStatus}
            overlayClose={false}
            xButton={false}
            title="Change username"
          >
            <ChangeUsername onClose={handleChangeUsernameModalStatus} />
          </Modal>,
          document.body,
        )}
      {isLoading && createPortal(<Loader />, document.body)}
    </div>
  );
};

export default Header;
