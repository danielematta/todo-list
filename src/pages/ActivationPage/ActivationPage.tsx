import { useEffect, useRef, useState } from "react";
import styles from "./ActivationPage.module.css";
import { useSearchParams } from "react-router";
import { activate } from "../../services/auth.service";
import {
  isApiError,
  type ActivateResponseTypes,
} from "../../types/auth.types";
import Loader from "../../components/Loader/Loader";
import { createPortal } from "react-dom";

const ActivationPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [activationRes, setActivationRes] = useState<ActivateResponseTypes>();
  const [activationError, setActivationError] = useState<string | undefined>(
    undefined,
  );
  const [isLoading, setIsLoading] = useState(false);
  const activationStarted = useRef(false);

  useEffect(() => {
    const activation = async () => {
      if (token && !activationStarted.current) {
        activationStarted.current = true;
        try {
          setIsLoading(true);
          const res = await activate(token);
          setActivationRes(res);
        } catch (error) {
          if (isApiError(error)) {
            setActivationError(error.message);
          } else {
            setActivationError("Something went wrong. Please try again.");
          }
        } finally {
          setIsLoading(false);
        }
      }
    };
    activation();
  }, [token]);

  return (
    <>
      <div className={styles.activationPageContainer}>
        <h1 className={styles.authTitle}>Account activation</h1>
        <div className={styles.response}>{activationRes?.message}</div>
        <div className={styles.activationErrors}>{activationError}</div>
      </div>
      {isLoading && createPortal(<Loader />, document.body)}
    </>
  );
};

export default ActivationPage;
