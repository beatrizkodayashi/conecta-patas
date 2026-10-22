import { Router } from "express";
import { requireAuth } from "../../middlewares/auth";
import { getMe, login, registerAdopter, registerOng } from "./auth.service";
import { loginSchema, registerAdopterSchema, registerOngSchema } from "./auth.schemas";

export const authRouter = Router();

authRouter.post("/register/adopter", async (req, res, next) => {
  try {
    const input = registerAdopterSchema.parse(req.body);
    const result = await registerAdopter(input);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

authRouter.post("/register/ong", async (req, res, next) => {
  try {
    const input = registerOngSchema.parse(req.body);
    const result = await registerOng(input);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

authRouter.post("/login", async (req, res, next) => {
  try {
    const input = loginSchema.parse(req.body);
    const result = await login(input);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

authRouter.get("/me", requireAuth(), async (req, res, next) => {
  try {
    const user = await getMe(req.user!.id);
    res.json(user);
  } catch (error) {
    next(error);
  }
});
