import { prisma } from "@conecta-patas/db";
import bcrypt from "bcryptjs";
import jwt, { type SignOptions } from "jsonwebtoken";
import { env } from "../../env";
import { HttpError } from "../../lib/http-error";
import type { z } from "zod";
import type { loginSchema, registerAdopterSchema, registerOngSchema } from "./auth.schemas";

const usuarioPublico = {
  id: true,
  email: true,
  papel: true,
  cpf: true,
  cnpjOng: true,
  criadoEm: true,
  cliente: true,
  ong: true,
} as const;

function signToken(usuario: { id: number; email: string; papel: string }) {
  return jwt.sign(
    { id: usuario.id, email: usuario.email, role: usuario.papel as "CLIENTE" | "ONG" },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn as SignOptions["expiresIn"] },
  );
}

export async function registerAdopter(input: z.infer<typeof registerAdopterSchema>) {
  const senhaHash = await bcrypt.hash(input.password, 10);
  const email = input.email.toLowerCase();

  const usuario = await prisma.$transaction(async (tx) => {
    await tx.cliente.create({
      data: {
        cpf: input.cpf,
        nome: input.nome,
        telefone: input.telefone,
        endereco: input.endereco,
        email,
        cidade: input.cidade,
        tipoResidencia: input.tipoResidencia,
        temCriancas: input.temCriancas,
        temIdosos: input.temIdosos,
        temAdultos: input.temAdultos,
        temOutrosAnimais: input.temOutrosAnimais,
        obsOutrosAnimais: input.obsOutrosAnimais,
        rotina: input.rotina,
        especiePreferida: input.especiePreferida,
        portePreferido: input.portePreferido,
        sexoPreferido: input.sexoPreferido,
        aceitaNecessidadesEspeciais: input.aceitaNecessidadesEspeciais,
      },
    });

    return tx.usuario.create({
      data: {
        email,
        senhaHash,
        papel: "CLIENTE",
        cpf: input.cpf,
      },
      select: usuarioPublico,
    });
  });

  return { token: signToken(usuario), user: usuario };
}

export async function registerOng(input: z.infer<typeof registerOngSchema>) {
  const senhaHash = await bcrypt.hash(input.password, 10);
  const email = input.email.toLowerCase();

  const usuario = await prisma.$transaction(async (tx) => {
    await tx.ong.create({
      data: {
        cnpjOng: input.cnpjOng,
        nomeOng: input.nomeOng,
        responsavel: input.responsavel,
        email,
        telefone: input.telefone,
        endereco: input.endereco,
        cidade: input.cidade,
      },
    });

    return tx.usuario.create({
      data: {
        email,
        senhaHash,
        papel: "ONG",
        cnpjOng: input.cnpjOng,
      },
      select: usuarioPublico,
    });
  });

  return { token: signToken(usuario), user: usuario };
}

export async function login(input: z.infer<typeof loginSchema>) {
  const usuario = await prisma.usuario.findUnique({
    where: { email: input.email.toLowerCase() },
    include: { cliente: true, ong: true },
  });

  if (!usuario) {
    throw new HttpError(401, "E-mail ou senha invalidos");
  }

  const valid = await bcrypt.compare(input.password, usuario.senhaHash);
  if (!valid) {
    throw new HttpError(401, "E-mail ou senha invalidos");
  }

  const { senhaHash: _senhaHash, ...safeUser } = usuario;
  return { token: signToken(usuario), user: safeUser };
}

export async function getMe(userId: number) {
  const usuario = await prisma.usuario.findUnique({
    where: { id: userId },
    select: usuarioPublico,
  });

  if (!usuario) {
    throw new HttpError(401, "Usuario nao encontrado");
  }

  return usuario;
}
