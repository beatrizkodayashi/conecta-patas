import cors from "cors";
import express from "express";
import { errorHandler } from "./middlewares/error";
import { authRouter } from "./modules/auth/auth.routes";
import { adoptersRouter } from "./modules/adopters/adopters.routes";
import { petsRouter } from "./modules/pets/pets.routes";
import { interestsRouter } from "./modules/interests/interests.routes";

export const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "conecta-patas-api" });
});

app.use("/api/auth", authRouter);
app.use("/api/adopters", adoptersRouter);
app.use("/api/pets", petsRouter);
app.use("/api/interests", interestsRouter);

app.use((_req, res) => {
  res.status(404).json({ error: "Rota nao encontrada" });
});

app.use(errorHandler);
