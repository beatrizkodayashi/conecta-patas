import { env } from "./env";
import { app } from "./app";

app.listen(env.port, () => {
  console.log(`API Conecta Patas em http://localhost:${env.port}`);
});
