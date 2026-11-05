import { loginAction, loginLoader } from "./model/loginRoute";
import { LoginPage } from "./ui/LoginPage";

export const loginRoute = {
  action: loginAction,
  Component: LoginPage,
  loader: loginLoader,
  // After a failed sign-in only the action result changes; the session check is not repeated.
  shouldRevalidate: () => false,
};
