import { createServer } from "node:http";

import { createApp } from "./app";
import { env } from "./config/env";
import { createSocketServer } from "./realtime/socket";

async function bootstrap() {
  const app = createApp();
  const server = createServer(app);

  await createSocketServer(server);

  server.listen(env.PORT, () => {
    console.log(`CanvasFlow API listening on http://localhost:${env.PORT}`);
  });
}

bootstrap().catch((error) => {
  console.error("Failed to start CanvasFlow API", error);
  process.exit(1);
});
