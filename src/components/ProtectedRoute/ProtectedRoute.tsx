import { Outlet, useNavigate } from "react-router";
import { useReduxDispatch, useReduxSelector } from "../../store/useRedux";
import { useEffect, useState } from "react";
import { clearToken, tokenSelector } from "../../reducers/tokenSlice";
import {
  clearUser,
  setIsAuthorized,
  setUser,
  userSelector,
} from "../../reducers/userSlice";
import { me } from "../../services/auth.service";
import Loader from "../Loader/Loader";
import { createPortal } from "react-dom";

const ProtectedRoute = () => {
  const token = useReduxSelector(tokenSelector);
  const user = useReduxSelector(userSelector);
  const navigate = useNavigate();
  const dispatch = useReduxDispatch();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const authCheck = async () => {
      
      if (!token) {
        navigate("/");
        return;
      }
      if (user.isAuthorized) {
        return;
      }
      try {
        setIsLoading(true);
        const res = await me(token);
        dispatch(setUser(res.user));
        dispatch(setIsAuthorized(true));
      } catch {
        dispatch(clearToken());
        dispatch(clearUser());
        dispatch(setIsAuthorized(false));
        navigate("/");
      } finally {
        setIsLoading(false);
      }
    };
    authCheck();
  }, [token, user.isAuthorized, dispatch, navigate]);

  return (
    <>
      {!isLoading && <Outlet />}
      {isLoading && createPortal(<Loader />, document.body)}
    </>
  );
};

export default ProtectedRoute;
