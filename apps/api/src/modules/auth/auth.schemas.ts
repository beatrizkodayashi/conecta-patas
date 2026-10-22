import { z } from "zod";
import { residenceTypeSchema, sexSchema, sizeSchema, speciesSchema } from "../../lib/schemas";

export const registerAdopterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
  phone: z.string().min(8),
  address: z.string().min(3),
  city: z.string().min(2),
  residenceType: residenceTypeSchema,
  hasChildren: z.boolean().default(false),
  hasElderly: z.boolean().default(false),
  hasAdults: z.boolean().default(true),
  hasOtherAnimals: z.boolean().default(false),
  otherAnimalsNote: z.string().optional(),
  routine: z.string().min(3),
  preferredSpecies: speciesSchema.optional(),
  preferredSize: sizeSchema.optional(),
  preferredSex: sexSchema.optional(),
  acceptsSpecialNeeds: z.boolean().default(false),
});

export const registerOngSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
  cnpj: z.string().min(11),
  responsible: z.string().min(2),
  phone: z.string().min(8),
  address: z.string().min(3),
  city: z.string().min(2),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});
