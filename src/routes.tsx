import App from "./App";
import AuthLayout from "./layout/AuthLayout/AuthLayout.tsx";
import LoginForm from "./components/LoginForm/LoginForm.tsx";
import RegistrationForm from "./components/RegistrationForm/RegistrationForm.tsx";
import ForgotPassword from "./components/ForgotPassword/ForgotPassword.tsx";
import ResetPassword from "./components/ResetPassword/ResetPassword.tsx";
import ResetPasswordSuccessPage from "./pages/ResetPasswordSuccessPage/ResetPasswordSuccessPage.tsx";
import ActivationPage from "./pages/ResetPasswordSuccessPage/ActivationPage/ActivationPage.tsx";
import HomeLayout from "./layout/HomeLayout/HomeLayout.tsx";
import ActivityTabs from "./components/Activities/ActivityTabs/ActivityTabs.tsx";

export const routes = [
  {
    path: "/",
    element: <App />,
    children: [
      {
        element: <AuthLayout />,
        children: [
          {
            index: true,
            element: <LoginForm />,
          },
          {
            path: "register",
            element: <RegistrationForm />,
          },
          {
            path: "forgot-password",
            element: <ForgotPassword />,
          },
          {
            path: "reset-password",
            element: <ResetPassword />,
          },
          {
            path: "reset-password-success",
            element: <ResetPasswordSuccessPage />,
          },
          {
            path: "activation",
            element: <ActivationPage />,
          },
        ],
      },
      {
        element: <HomeLayout />,
        children: [
          {
            path: "activities",
            element: <ActivityTabs />
          }
        ]
      },
    ],
  },
];
