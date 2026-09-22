import { app } from "#app";
import { env } from "#config/env";

app.listen(env.port, () => {
  console.log(`API is listening on http://localhost:${String(env.port)}`);
});
