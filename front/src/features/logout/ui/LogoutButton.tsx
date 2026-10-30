import { Form, useLocation, useNavigation } from "react-router";

import { routes } from "@/shared/config/routes";

import { returnToField } from "../model/logout";
import styles from "./LogoutButton.module.css";

interface LogoutButtonProps {
  className?: string;
}

/** Posts to the logout route action, so signing out works like any other form submission. */
export function LogoutButton({ className }: LogoutButtonProps) {
  const navigation = useNavigation();
  const location = useLocation();
  const isLoggingOut = navigation.formAction === routes.logout;

  return (
    <Form className={className} method="post" action={routes.logout}>
      {/* A failed logout comes back to this page. */}
      <input type="hidden" name={returnToField} value={`${location.pathname}${location.search}`} />
      <button className={styles.button} type="submit" disabled={isLoggingOut}>
        Выйти
      </button>
    </Form>
  );
}
