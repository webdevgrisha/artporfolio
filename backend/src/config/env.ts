const defaultPort = 3000;

function parsePort(value: string | undefined): number {
  const port = Number(value ?? defaultPort);

  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error("PORT must be an integer between 1 and 65535");
  }

  return port;
}

export const env = Object.freeze({
  port: parsePort(process.env.PORT),
});
