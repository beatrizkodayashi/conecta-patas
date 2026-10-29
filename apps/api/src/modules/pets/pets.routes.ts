import { Router } from "express";
import { prisma, type Prisma } from "@conecta-patas/db";
import { z } from "zod";
import { optionalAuth, requireAuth } from "../../middlewares/auth";
import { parseId } from "../../lib/ids";
import {
  booleanQuerySchema,
  especieSchema,
  porteSchema,
  sexoSchema,
  statusPetSchema,
} from "../../lib/schemas";
import { archiveOwnPet, createPet, getPetById, listAvailablePets, updateOwnPet } from "./pets.service";

export const petsRouter = Router();

const listQuerySchema = z.object({
  tipoAnimal: especieSchema.optional(),
  porte: porteSchema.optional(),
  sexo: sexoSchema.optional(),
  cidade: z.string().min(2).optional(),
  bomComCriancas: booleanQuerySchema,
  bomComAnimais: booleanQuerySchema,
  necessidadesEspeciais: booleanQuerySchema,
});

const createPetSchema = z.object({
  nomePet: z.string().min(1),
  tipoAnimal: especieSchema,
  sexo: sexoSchema,
  idadeAprox: z.string().min(1),
  porte: porteSchema,
  historico: z.string().min(3),
  bomComCriancas: z.boolean(),
  bomComAnimais: z.boolean(),
  necessidadesEspeciais: z.boolean().default(false),
  obsNecessidades: z.string().optional(),
  vacinado: z.boolean().default(false),
  castrado: z.boolean().default(false),
  microchipado: z.boolean().default(false),
  fotoUrl: z.string().optional(),
  cidade: z.string().min(2),
});

const updatePetSchema = createPetSchema.partial().extend({
  statusAdocao: statusPetSchema.optional(),
});

petsRouter.get("/", optionalAuth, async (req, res, next) => {
  try {
    const query = listQuerySchema.parse(req.query);
    const filters: Prisma.PetWhereInput = {
      ...(query.tipoAnimal
        ? query.tipoAnimal === "Cao" || query.tipoAnimal === "Cachorro"
          ? { tipoAnimal: { in: ["Cao", "Cachorro"] } }
          : { tipoAnimal: query.tipoAnimal }
        : {}),
      ...(query.porte ? { porte: query.porte } : {}),
      ...(query.sexo ? { sexo: query.sexo } : {}),
      ...(query.cidade ? { cidade: { equals: query.cidade, mode: "insensitive" } } : {}),
      ...(query.bomComCriancas !== undefined ? { bomComCriancas: query.bomComCriancas } : {}),
      ...(query.bomComAnimais !== undefined ? { bomComAnimais: query.bomComAnimais } : {}),
      ...(query.necessidadesEspeciais !== undefined
        ? { necessidadesEspeciais: query.necessidadesEspeciais }
        : {}),
    };

    const cliente =
      req.user?.role === "CLIENTE"
        ? (
            await prisma.usuario.findUnique({
              where: { id: req.user.id },
              include: { cliente: true },
            })
          )?.cliente ?? null
        : null;

    const pets = await listAvailablePets(filters, cliente);
    res.json(pets);
  } catch (error) {
    next(error);
  }
});

petsRouter.get("/:id", optionalAuth, async (req, res, next) => {
  try {
    const pet = await getPetById(parseId(req.params.id), req.user);
    res.json(pet);
  } catch (error) {
    next(error);
  }
});

petsRouter.post("/", requireAuth(["ONG"]), async (req, res, next) => {
  try {
    const input = createPetSchema.parse(req.body);
    const pet = await createPet(req.user!.id, input);
    res.status(201).json(pet);
  } catch (error) {
    next(error);
  }
});

petsRouter.patch("/:id", requireAuth(["ONG"]), async (req, res, next) => {
  try {
    const input = updatePetSchema.parse(req.body);
    const pet = await updateOwnPet(req.user!.id, parseId(req.params.id), input);
    res.json(pet);
  } catch (error) {
    next(error);
  }
});

petsRouter.delete("/:id", requireAuth(["ONG"]), async (req, res, next) => {
  try {
    const pet = await archiveOwnPet(req.user!.id, parseId(req.params.id));
    res.json(pet);
  } catch (error) {
    next(error);
  }
});
