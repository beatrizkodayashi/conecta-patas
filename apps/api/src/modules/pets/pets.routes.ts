import { Router } from "express";
import { prisma, Role, type Prisma } from "@conecta-patas/db";
import { z } from "zod";
import { optionalAuth, requireAuth } from "../../middlewares/auth";
import {
  booleanQuerySchema,
  petStatusSchema,
  sexSchema,
  sizeSchema,
  speciesSchema,
} from "../../lib/schemas";
import { archiveOwnPet, createPet, getPetById, listAvailablePets, updateOwnPet } from "./pets.service";

export const petsRouter = Router();

const listQuerySchema = z.object({
  species: speciesSchema.optional(),
  size: sizeSchema.optional(),
  sex: sexSchema.optional(),
  city: z.string().min(2).optional(),
  goodWithChildren: booleanQuerySchema,
  goodWithAnimals: booleanQuerySchema,
  specialNeeds: booleanQuerySchema,
});

const createPetSchema = z.object({
  name: z.string().min(1),
  species: speciesSchema,
  sex: sexSchema,
  approximateAge: z.string().min(1),
  size: sizeSchema,
  characteristics: z.string().min(3),
  goodWithChildren: z.boolean(),
  goodWithAnimals: z.boolean(),
  specialNeeds: z.boolean().default(false),
  specialNeedsNote: z.string().optional(),
  vaccinated: z.boolean().default(false),
  neutered: z.boolean().default(false),
  photos: z.array(z.string()).default([]),
  city: z.string().min(2),
});

const updatePetSchema = createPetSchema.partial().extend({
  status: petStatusSchema.optional(),
});

petsRouter.get("/", optionalAuth, async (req, res, next) => {
  try {
    const query = listQuerySchema.parse(req.query);
    const filters: Prisma.PetWhereInput = {
      ...(query.species ? { species: query.species } : {}),
      ...(query.size ? { size: query.size } : {}),
      ...(query.sex ? { sex: query.sex } : {}),
      ...(query.city ? { city: { equals: query.city, mode: "insensitive" } } : {}),
      ...(query.goodWithChildren !== undefined ? { goodWithChildren: query.goodWithChildren } : {}),
      ...(query.goodWithAnimals !== undefined ? { goodWithAnimals: query.goodWithAnimals } : {}),
      ...(query.specialNeeds !== undefined ? { specialNeeds: query.specialNeeds } : {}),
    };

    const adopter =
      req.user?.role === "ADOTANTE"
        ? await prisma.adopter.findUnique({ where: { userId: req.user.id } })
        : null;

    const pets = await listAvailablePets(filters, adopter);
    res.json(pets);
  } catch (error) {
    next(error);
  }
});

petsRouter.get("/:id", optionalAuth, async (req, res, next) => {
  try {
    const pet = await getPetById(req.params.id, req.user);
    res.json(pet);
  } catch (error) {
    next(error);
  }
});

petsRouter.post("/", requireAuth([Role.ONG]), async (req, res, next) => {
  try {
    const input = createPetSchema.parse(req.body);
    const pet = await createPet(req.user!.id, input);
    res.status(201).json(pet);
  } catch (error) {
    next(error);
  }
});

petsRouter.patch("/:id", requireAuth([Role.ONG]), async (req, res, next) => {
  try {
    const input = updatePetSchema.parse(req.body);
    const pet = await updateOwnPet(req.user!.id, req.params.id, input);
    res.json(pet);
  } catch (error) {
    next(error);
  }
});

petsRouter.delete("/:id", requireAuth([Role.ONG]), async (req, res, next) => {
  try {
    const pet = await archiveOwnPet(req.user!.id, req.params.id);
    res.json(pet);
  } catch (error) {
    next(error);
  }
});
