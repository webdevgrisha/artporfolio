// Creates the admin in the Auth emulator, which starts empty on every run, or sets the email and
// password of the admin already there. The UID is ADMIN_UID from backend/.env.local, so the API
// accepts the account.
//
//   pnpm emulators:admin [email] [password]

import { readFileSync } from "node:fs";
import { parseEnv } from "node:util";

const [email = "admin@example.com", password = "admin123"] = process.argv.slice(2);

const { ADMIN_UID: adminUid } = parseEnv(readFileSync("backend/.env.local", "utf8"));
const { projects } = JSON.parse(readFileSync(".firebaserc", "utf8"));
const { auth } = JSON.parse(readFileSync("firebase.json", "utf8")).emulators;

if (!adminUid) {
  throw new Error("ADMIN_UID is missing in backend/.env.local");
}

const accountsUrl = `http://127.0.0.1:${auth.port}/identitytoolkit.googleapis.com/v1/projects/${projects.default}/accounts`;

/** Sends a request of the Admin SDK: the emulator accepts "owner" as its token. */
async function post(url, body) {
  const response = await fetch(url, {
    body: JSON.stringify(body),
    headers: { Authorization: "Bearer owner", "Content-Type": "application/json" },
    method: "POST",
  }).catch(() => {
    throw new Error("The Auth emulator is not running: start it with pnpm emulators");
  });
  const { error } = response.ok ? {} : await response.json();

  return error?.message ?? (response.ok ? undefined : String(response.status));
}

const account = { email, localId: adminUid, password };
let error = await post(accountsUrl, account);

if (error === "DUPLICATE_LOCAL_ID") {
  error = await post(`${accountsUrl}:update`, account);
}

if (error) {
  throw new Error(`The Auth emulator refused the admin: ${error}`);
}

console.log(`Admin: ${email} / ${password}`);
