import { z } from "zod";
import {
  cnpjSchema,
  cpfSchema,
  porteSchema,
  sexoSchema,
  especieSchema,
  telefoneSchema,
  tipoResidenciaSchema,
} from "../../lib/schemas";

export const registerAdopterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  cpf: cpfSchema,
  nome: z.string().min(2),
  telefone: telefoneSchema,
  endereco: z.string().min(3),
  cidade: z.string().min(2),
  tipoResidencia: tipoResidenciaSchema,
  temCriancas: z.boolean().default(false),
  temIdosos: z.boolean().default(false),
  temAdultos: z.boolean().default(true),
  temOutrosAnimais: z.boolean().default(false),
  obsOutrosAnimais: z.string().optional(),
  rotina: z.string().min(3),
  especiePreferida: especieSchema.optional(),
  portePreferido: porteSchema.optional(),
  sexoPreferido: sexoSchema.optional(),
  aceitaNecessidadesEspeciais: z.boolean().default(false),
});

export const registerOngSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  cnpjOng: cnpjSchema,
  nomeOng: z.string().min(2),
  responsavel: z.string().min(2),
  telefone: telefoneSchema,
  endereco: z.string().min(3),
  cidade: z.string().min(2),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});
