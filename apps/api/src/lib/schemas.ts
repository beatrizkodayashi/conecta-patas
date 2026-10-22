import { z } from "zod";

export const roleSchema = z.enum(["ADOTANTE", "ONG"]);
export const residenceTypeSchema = z.enum(["CASA", "APARTAMENTO"]);
export const speciesSchema = z.enum(["CAO", "GATO"]);
export const sexSchema = z.enum(["MACHO", "FEMEA"]);
export const sizeSchema = z.enum(["PEQUENO", "MEDIO", "GRANDE"]);
export const petStatusSchema = z.enum(["DISPONIVEL", "EM_ANALISE", "ADOTADO", "ARQUIVADO"]);
export const interestStatusSchema = z.enum(["PENDENTE", "ACEITO", "RECUSADO"]);

export const booleanQuerySchema = z
  .enum(["true", "false"])
  .transform((value) => value === "true")
  .optional();
