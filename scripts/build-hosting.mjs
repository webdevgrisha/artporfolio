// Puts together what Firebase Hosting serves as files, from the builds of the two apps:
// - the admin (front/dist) under /admin;
// - the files of the public site (site/dist/client) at the root: its hashed assets, the icon and
//   robots.txt, which the functions runtime refuses to serve itself.
// Every other path goes to a function: see the rewrites of firebase.json.
//
//   node scripts/build-hosting.mjs   (after the builds of front and site)

import { cp, rm } from "node:fs/promises";

const hosting = "dist/hosting";

await rm(hosting, { force: true, recursive: true });
await cp("site/dist/client", hosting, { recursive: true });
await cp("front/dist", `${hosting}/admin`, { recursive: true });
