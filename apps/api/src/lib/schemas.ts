import { z } from "zod";

export const cpfSchema = z.string().regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, "CPF no formato 000.000.000-00");
export const cnpjSchema = z
  .string()
  .regex(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/, "CNPJ no formato 00.000.000/0000-00");
export const telefoneSchema = z
  .string()
  .regex(/^\(\d{2}\) \d{4,5}-\d{4}$/, "Telefone no formato (00) 00000-0000");

export const papelSchema = z.enum(["CLIENTE", "ONG"]);
export const tipoResidenciaSchema = z.enum(["Casa", "Apartamento"]);
export const sexoSchema = z.enum(["Macho", "Femea"]);
export const porteSchema = z.enum(["Pequeno", "Médio", "Grande"]);
export const especieSchema = z.enum(["Cao", "Gato", "Cachorro", "Coelho"]);
export const statusPetSchema = z.enum(["Disponível", "Em análise", "Adotado", "Arquivado"]);
export const statusAdocaoSchema = z.enum(["Pendente", "Em análise", "Concluída", "Cancelada"]);

export const booleanQuerySchema = z
  .enum(["true", "false"])
  .transform((value) => value === "true")
  .optional();
