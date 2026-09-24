import { LoginForm } from "@/pages/Admin/Login/components/LoginForm/LoginForm";
import styles from "@/pages/Admin/Login/Login.module.css";

export function Login() {
  return (
    <main className={styles.root}>
      <LoginForm onSubmit={() => undefined} />
    </main>
  );
}
