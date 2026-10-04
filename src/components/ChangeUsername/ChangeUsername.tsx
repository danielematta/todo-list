import { useState } from "react";
import styles from "./ChangeUsername.module.css";
import { useReduxSelector, useReduxDispatch } from "../../store/useRedux";
import { setUser, userSelector } from "../../reducers/userSlice";
import { updateUsername } from "../../services/auth.service";
import { tokenSelector } from "../../reducers/tokenSlice";
import { isApiError } from "../../types/auth.types";
import { createPortal } from "react-dom";
import Loader from "../Loader/Loader";
import { usernameIsEmpty } from "../../validators/auth.validators";

const ChangeUsername = ({ onClose }: { onClose: () => void }) => {
  const user = useReduxSelector(userSelector);
  const token = useReduxSelector(tokenSelector);
  const [usernameValue, setUsernameValue] = useState(user.user?.name ?? "");
  const [isLoading, setIsLoading] = useState(false);
  const [changeUsernameFormError, setChangeUsernameFormError] = useState<
    string | undefined
  >(undefined);
  const [usernameError, setUsernameError] = useState<string | undefined>(
    undefined,
  );
  const dispatch = useReduxDispatch();

  const handleUsernameValueChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setUsernameValue(e.target.value);

    if (usernameError) {
      setUsernameError(undefined);
    }
  };

  const handleChangeUsernameSubmit = async (
    e: React.SubmitEvent<HTMLFormElement>,
  ) => {
    e.preventDefault();

    const usernameErrorMsg = usernameIsEmpty(usernameValue);
    setUsernameError(usernameErrorMsg);

    if (!token || usernameErrorMsg) {
      return;
    }

    try {
      setIsLoading(true);
      const res = await updateUsername({ name: usernameValue, token: token });
      dispatch(setUser(res.user));
      onClose();
    } catch (error) {
      if (isApiError(error)) {
        setChangeUsernameFormError(error.message);
        alert(error.message);
      } else {
        setChangeUsernameFormError("Something went wrong. Please try again.");
        alert("Something went wrong. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <form
        className={styles.changeUsernameForm}
        onSubmit={handleChangeUsernameSubmit}
      >
        <input
          className={
            `${styles.authInput} ${usernameError && styles.authInputError}`
          }
          type="text"
          id="name"
          name="name"
          placeholder="Username"
          value={usernameValue}
          onChange={handleUsernameValueChange}
        />
        {usernameError && (
          <div className={styles.usernameError}>
            {usernameError}
          </div>
        )}
        {changeUsernameFormError && (
          <div className={styles.changeUsernameFormError}>
            {changeUsernameFormError}
          </div>
        )}
        <div
          className={
            `${styles.buttonContainer} ${changeUsernameFormError && styles.buttonContainerWithError}`
          }
        >
          <button
            className={styles.cancelButton}
            type="button"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className={styles.changeUsernameSubmit}
            type="submit"
            disabled={isLoading || usernameValue === user.user?.name}
          >
            Save
          </button>
        </div>
      </form>
      {isLoading && createPortal(<Loader />, document.body)}
    </>
  );
};

export default ChangeUsername;
