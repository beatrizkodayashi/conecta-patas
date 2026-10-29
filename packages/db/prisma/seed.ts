import { hashSync } from "bcryptjs";
import { PrismaClient } from "../src/generated/client";

const prisma = new PrismaClient();
const senhaHash = hashSync("senha123", 10);

async function main() {
  const ong = await prisma.ong.findUnique({
    where: { cnpjOng: "11.111.111/0001-01" },
  });
  const cliente = await prisma.cliente.findUnique({
    where: { cpf: "111.111.111-11" },
  });

  if (!ong || !cliente) {
    throw new Error("Seed espera ONG 11.111.111/0001-01 e cliente 111.111.111-11 ja existentes.");
  }

  await prisma.ong.update({
    where: { cnpjOng: ong.cnpjOng },
    data: {
      responsavel: ong.responsavel ?? "Equipe Patinhas Felizes",
      cidade: ong.cidade ?? "Sao Paulo",
    },
  });

  await prisma.cliente.update({
    where: { cpf: cliente.cpf },
    data: {
      cidade: cliente.cidade ?? "Sao Paulo",
      tipoResidencia: cliente.tipoResidencia ?? "Apartamento",
      rotina: cliente.rotina ?? "Trabalho fora cerca de 8h por dia",
      especiePreferida: cliente.especiePreferida ?? "Gato",
      portePreferido: cliente.portePreferido ?? "Pequeno",
      sexoPreferido: cliente.sexoPreferido ?? "Femea",
    },
  });

  await prisma.usuario.upsert({
    where: { email: "contato@patinhasfelizes.org" },
    update: { senhaHash, papel: "ONG", cnpjOng: ong.cnpjOng, cpf: null },
    create: {
      email: "contato@patinhasfelizes.org",
      senhaHash,
      papel: "ONG",
      cnpjOng: ong.cnpjOng,
    },
  });

  await prisma.usuario.upsert({
    where: { email: "maria.silva@email.com" },
    update: { senhaHash, papel: "CLIENTE", cpf: cliente.cpf, cnpjOng: null },
    create: {
      email: "maria.silva@email.com",
      senhaHash,
      papel: "CLIENTE",
      cpf: cliente.cpf,
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
