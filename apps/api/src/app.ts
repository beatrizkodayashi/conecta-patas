import cors from "cors";
import express from "express";
import { errorHandler } from "./middlewares/error";

export const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "conecta-patas-api" });
});

app.use((_req, res) => {
  res.status(404).json({ error: "Rota nao encontrada" });
});

app.use(errorHandler);
