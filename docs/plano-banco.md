# Plano: alinhar banco existente e API

Banco da colaboradora no Neon: projeto **`projeto`**, database **`neondb`**, branch **`production`**.

Objetivo: o backend funcionar nesse banco. Podemos **melhorar o schema** (colunas e tabelas novas), mas **não renomear** as tabelas que já existem.

Implementado no código. `tipo_animal` **não** ganhou CHECK `Cao`/`Gato` porque o banco já tem `Cachorro` e `Coelho`.

---

## Premissas

1. Manter os nomes: `ong`, `cliente`, `pet`, `adocao`.
2. Manter as chaves atuais: CNPJ, CPF, `id_animal`, `id_adocao`.
3. Manter os formatos já validados no Postgres (CPF, CNPJ, telefone).
4. Manter os status em português (`Disponível`, `Pendente`, `Concluída`, etc.).
5. Não aplicar as migrations antigas do Prisma (`User`, `Adopter`, `Organization`, `Interest`, `Message`). Elas criariam um banco paralelo.
6. Prisma passa a **mapear** as tabelas reais (`@@map`) e ganha **uma migration só de ALTER/CREATE** do que falta.

---

## O que já está bom (não mexer)

| Tabela | Papel | Chave |
|--------|--------|--------|
| `ong` | cadastro da ONG | `cnpj_ong` |
| `cliente` | cadastro do adotante | `cpf` |
| `pet` | animal da ONG | `id_animal` |
| `adocao` | interesse / processo | `id_adocao` |

Relações que ficam:

- pet pertence à ONG (`pet.cnpj_ong` → `ong.cnpj_ong`)
- adoção liga pet + cliente + ONG
- um pet só pode ter uma adoção ativa (não `Cancelada`)

---

## Buracos atuais (o que impede a API)

| Necessidade do app | No banco hoje |
|--------------------|----------------|
| Login com senha | não existe |
| Papel (cliente vs ONG) | não existe |
| Questionário do adotante | não existe |
| Saúde / temperamento do pet | incompleto |
| Cidade para filtro | não existe |
| Arquivar pet | status não tem `Arquivado` |
| Chat no processo | não existe |
| Responsável da ONG | não existe |

Campo problemático (não renomear agora): `cliente.id_adocacao` (typo + FK circular). **Parar de usar**. A fonte da verdade da adoção continua sendo a tabela `adocao`.

---

## Proposta de schema

Duas linhas: **colunas novas** nas tabelas atuais + **2 tabelas novas** (`usuario` e `mensagem`). Nenhuma tabela velha muda de nome.

### 1. Tabela nova `usuario` (login)

Uma conta por e-mail, ligada a um cliente **ou** a uma ONG.

```text
usuario
  id            serial PK
  email         varchar UNIQUE NOT NULL
  senha_hash    varchar NOT NULL
  papel         varchar NOT NULL   -- CLIENTE | ONG
  cpf           varchar NULL  FK → cliente(cpf)
  cnpj_ong      varchar NULL  FK → ong(cnpj_ong)
  criado_em     timestamp
  atualizado_em timestamp
```

Regras:

- `papel = CLIENTE` → `cpf` obrigatório, `cnpj_ong` nulo
- `papel = ONG` → `cnpj_ong` obrigatório, `cpf` nulo
- um cliente/ONG tem no máximo um usuário

Assim o JWT continua simples e não inventamos senha dentro de `cliente`/`ong`.

### 2. Colunas novas em `ong`

| Coluna | Para quê |
|--------|----------|
| `responsavel` | RF03 |
| `cidade` | filtro de localidade |

`email` e `telefone` passam a ser **obrigatórios** no cadastro da API (no banco podem continuar nullable para não quebrar dado antigo).

### 3. Colunas novas em `cliente` (questionário)

| Coluna | Para quê |
|--------|----------|
| `cidade` | filtro / matching |
| `tipo_residencia` | `Casa` / `Apartamento` |
| `tem_criancas` | boolean |
| `tem_idosos` | boolean |
| `tem_adultos` | boolean |
| `tem_outros_animais` | boolean |
| `obs_outros_animais` | texto opcional |
| `rotina` | texto |
| `especie_preferida` | texto opcional (`Cao` / `Gato`) |
| `porte_preferido` | `Pequeno` / `Médio` / `Grande` |
| `sexo_preferido` | `Macho` / `Femea` |
| `aceita_necessidades_especiais` | boolean |

Não usamos `id_adocacao` na API.

### 4. Colunas novas em `pet`

O que já existe permanece: `nome_pet`, `tipo_animal`, `sexo`, `porte`, `idade_aprox`, `historico`, `castrado`, `microchipado`, `foto_url`, `status_adocao`.

| Coluna | Para quê |
|--------|----------|
| `cidade` | filtro de localidade |
| `bom_com_criancas` | temperamento |
| `bom_com_animais` | temperamento |
| `necessidades_especiais` | saúde (obrigatório ver antes do interesse) |
| `obs_necessidades` | texto opcional |
| `vacinado` | saúde |

Status: incluir **`Arquivado`** no CHECK atual (`Disponível`, `Em análise`, `Adotado`).

Uma foto (`foto_url`) basta para o trabalho. Sem array de fotos.

`tipo_animal`: passar a aceitar só `Cao` e `Gato` (CHECK novo, alinhado ao resto do banco).

### 5. Tabela `adocao` (quase igual)

Não renomear. Não mudar PKs/FKs.

Status que já existem e vamos usar:

| Status no banco | Significado na API |
|-----------------|--------------------|
| `Pendente` | interesse enviado |
| `Em análise` | ONG avaliando |
| `Concluída` | adoção aceita (pet vira `Adotado`) |
| `Cancelada` | recusada / desistência |

A regra dela (um pet, uma adoção ativa) fica. É mais simples e suficiente.

### 6. Tabela nova `mensagem`

Chat só dentro de uma adoção, como no RF10.

```text
mensagem
  id            serial PK
  id_adocao     int NOT NULL FK → adocao
  id_usuario    int NOT NULL FK → usuario
  conteudo      text NOT NULL
  criado_em     timestamp
```

---

## Valores canônicos (português, como o banco)

A API deixa de usar `CAO`, `DISPONIVEL`, `MACHO`. Passa a gravar exatamente o que o CHECK espera:

- sexo: `Macho`, `Femea`
- porte: `Pequeno`, `Médio`, `Grande`
- pet: `Disponível`, `Em análise`, `Adotado`, `Arquivado`
- adoção: `Pendente`, `Em análise`, `Concluída`, `Cancelada`
- residência: `Casa`, `Apartamento`
- espécie: `Cao`, `Gato`
- CPF: `123.456.789-00`
- CNPJ: `12.345.678/0001-90`
- telefone: `(11) 99999-9999`

---

## O que muda no código (depois que o plano for ok)

1. Reescrever `schema.prisma` mapeando `ong`, `cliente`, `pet`, `adocao`, `usuario`, `mensagem`.
2. Jogar fora a migration antiga que cria `User` / `Adopter` / etc.
3. Uma migration **aditiva**: `ALTER TABLE` + `CREATE TABLE usuario/mensagem`.
4. Ajustar Zod, serviços e Postman para CPF/CNPJ/telefone e status em português.
5. Filtro/matching só com o que o banco tiver: espécie, porte, sexo, cidade, temperamento, necessidades.
6. `.env` apontando para o projeto Neon **`projeto` / `neondb`**. O projeto vazio `conecta-patas` que eu criei pode ser apagado.

Não precisa de frontend. Teste continua no Postman.

---

## O que não vamos fazer

- Renomear `ong`, `cliente`, `pet`, `adocao`
- Trocar CPF/CNPJ por UUID
- Matching com IA
- Várias fotos, websocket, e-mail de verificação
- Aplicar as migrations atuais em cima do banco dela

---

## Ordem de execução (quando autorizar)

1. Confirmar este plano com a colaboradora do banco.
2. Prisma mapeando as 4 tabelas atuais (sem migration ainda) — a API já lê o que existe.
3. Migration aditiva: colunas + `usuario` + `mensagem`.
4. Adaptar auth, pets, adoções, mensagens, painel.
5. Seed + Postman com dados no formato dos CHECKs.

---

## Decisão pendente

`cliente.id_adocacao`: deixar a coluna no banco e ignorar no código (recomendado, zero risco de quebrar o schema dela) **ou** pedir para ela dropar depois.
