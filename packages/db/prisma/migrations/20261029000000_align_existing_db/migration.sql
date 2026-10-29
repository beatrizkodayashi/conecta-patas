-- Additive only. Assumes ong, cliente, pet and adocao already exist.

ALTER TABLE "ong"
  ADD COLUMN IF NOT EXISTS "responsavel" VARCHAR,
  ADD COLUMN IF NOT EXISTS "cidade" VARCHAR;

ALTER TABLE "cliente"
  ADD COLUMN IF NOT EXISTS "cidade" VARCHAR,
  ADD COLUMN IF NOT EXISTS "tipo_residencia" VARCHAR,
  ADD COLUMN IF NOT EXISTS "tem_criancas" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "tem_idosos" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "tem_adultos" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "tem_outros_animais" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "obs_outros_animais" VARCHAR,
  ADD COLUMN IF NOT EXISTS "rotina" TEXT,
  ADD COLUMN IF NOT EXISTS "especie_preferida" VARCHAR,
  ADD COLUMN IF NOT EXISTS "porte_preferido" VARCHAR,
  ADD COLUMN IF NOT EXISTS "sexo_preferido" VARCHAR,
  ADD COLUMN IF NOT EXISTS "aceita_necessidades_especiais" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "pet"
  ADD COLUMN IF NOT EXISTS "cidade" VARCHAR,
  ADD COLUMN IF NOT EXISTS "bom_com_criancas" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "bom_com_animais" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "necessidades_especiais" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "obs_necessidades" TEXT,
  ADD COLUMN IF NOT EXISTS "vacinado" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "pet" DROP CONSTRAINT IF EXISTS "chk_pet_status";
ALTER TABLE "pet" ADD CONSTRAINT "chk_pet_status"
  CHECK ("status_adocao" IS NULL OR "status_adocao" IN ('Disponível', 'Adotado', 'Em análise', 'Arquivado'));

ALTER TABLE "cliente" DROP CONSTRAINT IF EXISTS "chk_cliente_tipo_residencia";
ALTER TABLE "cliente" ADD CONSTRAINT "chk_cliente_tipo_residencia"
  CHECK ("tipo_residencia" IS NULL OR "tipo_residencia" IN ('Casa', 'Apartamento'));

ALTER TABLE "cliente" DROP CONSTRAINT IF EXISTS "chk_cliente_porte_preferido";
ALTER TABLE "cliente" ADD CONSTRAINT "chk_cliente_porte_preferido"
  CHECK ("porte_preferido" IS NULL OR "porte_preferido" IN ('Pequeno', 'Médio', 'Grande'));

ALTER TABLE "cliente" DROP CONSTRAINT IF EXISTS "chk_cliente_sexo_preferido";
ALTER TABLE "cliente" ADD CONSTRAINT "chk_cliente_sexo_preferido"
  CHECK ("sexo_preferido" IS NULL OR "sexo_preferido" IN ('Macho', 'Femea'));

CREATE TABLE IF NOT EXISTS "usuario" (
  "id" SERIAL PRIMARY KEY,
  "email" VARCHAR NOT NULL,
  "senha_hash" VARCHAR NOT NULL,
  "papel" VARCHAR NOT NULL,
  "cpf" VARCHAR,
  "cnpj_ong" VARCHAR,
  "criado_em" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "atualizado_em" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "usuario_email_key" UNIQUE ("email"),
  CONSTRAINT "usuario_cpf_key" UNIQUE ("cpf"),
  CONSTRAINT "usuario_cnpj_ong_key" UNIQUE ("cnpj_ong"),
  CONSTRAINT "chk_usuario_papel" CHECK ("papel" IN ('CLIENTE', 'ONG')),
  CONSTRAINT "chk_usuario_vinculo" CHECK (
    ("papel" = 'CLIENTE' AND "cpf" IS NOT NULL AND "cnpj_ong" IS NULL)
    OR
    ("papel" = 'ONG' AND "cnpj_ong" IS NOT NULL AND "cpf" IS NULL)
  ),
  CONSTRAINT "usuario_cpf_fkey" FOREIGN KEY ("cpf") REFERENCES "cliente"("cpf") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "usuario_cnpj_ong_fkey" FOREIGN KEY ("cnpj_ong") REFERENCES "ong"("cnpj_ong") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "mensagem" (
  "id" SERIAL PRIMARY KEY,
  "id_adocao" INTEGER NOT NULL,
  "id_usuario" INTEGER NOT NULL,
  "conteudo" TEXT NOT NULL,
  "criado_em" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "mensagem_id_adocao_fkey" FOREIGN KEY ("id_adocao") REFERENCES "adocao"("id_adocao") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "mensagem_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "mensagem_id_adocao_idx" ON "mensagem"("id_adocao");
