# Backend com Prisma e MySQL

O schema ativo usa MySQL. A configuração em `prisma.config.ts` aponta para
`database/schema.prisma` e `database/migrations-mysql`. As migrations PostgreSQL
em `database/migrations` são históricas e não são aplicadas por esta configuração.

Execute no PowerShell, com o MySQL iniciado e o banco `caragua360` criado:

```powershell
cd C:\Users\cg3037835\caragua360\backend
npm.cmd ci
if (!(Test-Path .env)) { Copy-Item .env.example .env }
```

Configure no `.env` sua conexão real:

```dotenv
DATABASE_URL=mysql://root:SUA_SENHA@localhost:3306/caragua360
```

Caracteres especiais na senha precisam ser codificados na URL. Configure também
`CARAGUA_JWT_SECRET` e, se executar o seed, `SEED_ADMIN_EMAIL` e
`SEED_ADMIN_PASSWORD`.

Pare o backend antes de gerar o cliente para evitar bloqueio da DLL no Windows.
Depois execute:

```powershell
npm.cmd run db:validate
npm.cmd run db:generate
npm.cmd run db:migrate
npm.cmd run db:status
npm.cmd run build
npm.cmd run start:dev
```

`db:migrate` aplica a migration inicial em um banco MySQL vazio. Se já houver
tabelas, é necessário avaliar e estabelecer uma baseline antes de aplicar
migrations. Esta configuração não transfere dados de um PostgreSQL existente.

Para popular os dados de demonstração, execute opcionalmente:

```powershell
npm.cmd run db:seed
```

Para visualizar os dados, use `npm.cmd run db:studio`. Para criar uma migration
após alterar o schema em desenvolvimento, use:

```powershell
npm.cmd run db:migrate:dev -- --name nome_da_alteracao
```

O usuário de desenvolvimento precisa de permissão para criar o banco temporário
usado pelo Prisma Migrate. Em produção, use somente `db:migrate` para aplicar
as migrations versionadas.
