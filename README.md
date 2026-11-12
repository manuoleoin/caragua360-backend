# Caragua360 — configuração do backend NestJS

Backend de turismo com NestJS 11, TypeScript e Prisma 6.19/PostgreSQL. Inclui autenticação, destinos, hospedagens, restaurantes, atividades, eventos, roteiros, avaliações, comentários, favoritos, sustentabilidade, sugestões e administração.

## Documentação

- **Este README:** instalação, banco, variáveis, execução, produção e resolução de problemas.
- **[README da API](docs/README-API.md):** como autenticar, fazer requisições e usar cada endpoint, com exemplos e corpos JSON.
- **[README do código](docs/README-CODIGO.md):** responsabilidade dos arquivos, fluxo de uma requisição, regras de negócio e manutenção.
- [Inventário das 77 rotas migradas](routes.json). Além delas, há duas rotas de saúde.

## 1. Pré-requisitos

Tenha Node.js 22 ou superior, npm e um servidor PostgreSQL acessível. Os exemplos usam PowerShell no Windows. Execute os comandos na raiz deste projeto, onde está `package.json`.

```powershell
Set-Location 'C:\Users\cg3037835\Downloads\caragua360-nestjs'
node --version
npm.cmd --version
```

Use `npm.cmd` para evitar o bloqueio de `npm.ps1` pela política do PowerShell. Em Linux/macOS, use `npm` e adapte os comandos de caminhos/variáveis.

O backend não instala nem inicia o PostgreSQL. O frontend original também não é iniciado por este projeto.

## 2. Instalar e criar o ambiente

```powershell
npm.cmd ci
Copy-Item .env.example .env
```

Copie o exemplo somente se ainda não tiver um `.env` configurado. `npm ci` instala as versões do `package-lock.json`; use `npm install` quando estiver alterando dependências.

Edite o `.env`:

```dotenv
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://postgres:SUA_SENHA@localhost:5432/caragua360?schema=public
CARAGUA_JWT_SECRET=COLOQUE_UMA_CHAVE_ALEATORIA_LONGA_AQUI
PUBLIC_SITE_URL=http://localhost:5173
UPLOAD_DIR=./uploads
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM=Caragua360 <no-reply@caragua360.local>
BALNEABILITY_API_URL=
BALNEABILITY_SOURCE_NAME=CETESB
BALNEABILITY_TIMEOUT_MS=8000
```

Gere uma chave e copie o resultado para `CARAGUA_JWT_SECRET`:

```powershell
node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"
```

Não envie o `.env` ao Git. O arquivo está no `.gitignore`.

### O que significa cada variável

| Variável | Uso e valor padrão no código |
| --- | --- |
| `NODE_ENV` | `development` por padrão. Apenas o valor exato `production` ativa as opções de produção. |
| `PORT` | Porta HTTP, padrão `3000`. |
| `DATABASE_URL` | Conexão PostgreSQL com usuário, senha, host, porta e nome do banco. |
| `CARAGUA_JWT_SECRET` | Chave de assinatura HS256. Em produção é obrigatória e precisa de pelo menos 32 caracteres. Alterá-la invalida tokens assinados com a chave anterior. |
| `PUBLIC_SITE_URL` | Origem única permitida por CORS, com credenciais. Ex.: `http://localhost:5173`, sem caminho. Também é fallback para links de recuperação. Vazio não habilita CORS explicitamente. |
| `UPLOAD_DIR` | Pasta local dos arquivos. Padrão: `uploads` no diretório de execução. Caminhos relativos dependem do diretório em que o processo foi iniciado. |
| `SMTP_HOST` | Servidor SMTP. Vazio ativa entrega simulada por console, sem e-mail real. |
| `SMTP_PORT` | Padrão `587`. O transporte usa TLS direto quando a porta é `465`. |
| `SMTP_USER` / `SMTP_PASS` | Credenciais do servidor SMTP, se exigidas. |
| `SMTP_FROM` | Remetente, padrão `Caragua360 <no-reply@caragua360.local>`. |
| `BALNEABILITY_API_URL` | URL JSON do provedor de balneabilidade. Vazio impede sincronização. |
| `BALNEABILITY_SOURCE_NAME` | Nome da fonte exibido nos registros, padrão `CETESB`. O nome não configura automaticamente uma URL oficial. |
| `BALNEABILITY_TIMEOUT_MS` | Tempo limite da integração, padrão `8000` milissegundos. |
| `SEED_ADMIN_EMAIL` | Usada somente pelo seed, padrão `admin@caragua360.com`. Opcional no `.env`. |
| `SEED_ADMIN_PASSWORD` | Usada somente na criação inicial do administrador pelo seed. Defina sua própria senha para ambiente de demonstração. |

Os prazos abaixo são constantes em `src/config/environment.ts`, não variáveis configuráveis por `.env`: sessão de 7 dias, recuperação de senha de 24 horas, 3 falhas de login e bloqueio de 15 minutos.

## 3. Configurar o PostgreSQL

Crie um banco vazio pelo pgAdmin ou pelo `psql`. Exemplo para um PostgreSQL já instalado:

```powershell
psql -U postgres -h localhost -p 5432 -c 'CREATE DATABASE caragua360;'
```

Se `psql` não estiver no PATH, use o terminal SQL do pgAdmin. O usuário informado em `DATABASE_URL` precisa de permissões para aplicar as tabelas e migrations no banco escolhido.

Formato da URL:

```text
postgresql://USUARIO:SENHA@HOST:5432/BANCO?schema=public
```

Senhas com caracteres especiais precisam de codificação na URL: `@` vira `%40`, `#` vira `%23`, por exemplo. Use os dados de conexão fornecidos pelo seu provedor em bancos hospedados. Se o provedor exigir SSL, utilize `sslmode=require`; a aplicação também normaliza `ssl=true` ou `ssl=1` para esse formato.

Gere o cliente e aplique as migrations:

```powershell
npm.cmd run db:generate
npm.cmd run db:migrate
```

`db:generate` produz o cliente tipado do Prisma; não cria tabelas. `db:migrate` executa `prisma migrate deploy`, aplicando migrations já existentes. Não use esse comando como gerador de novas migrations.

Se o banco já tiver as tabelas originais, confira o histórico de migrations antes de executar. A migration inicial é destinada à instalação em um banco vazio ou com histórico Prisma compatível; não resolve automaticamente um banco preexistente sem histórico.

## 4. Dados iniciais e administrador

O seed é opcional. Ele escreve dados demonstrativos e contas no banco, por isso execute em um banco destinado a desenvolvimento/demonstração.

Para carregar explicitamente o `.env` no script de seed:

```powershell
node --env-file=.env database/seed.js
```

O script `npm.cmd run db:seed` executa apenas `node database/seed.js`. Diferentemente de `src/main.ts`, o seed não importa `dotenv/config`; portanto, esse script exige as variáveis já exportadas no ambiente do processo. A chamada com `--env-file` acima evita essa diferença.

Antes da primeira execução, você pode adicionar ao `.env`:

```dotenv
SEED_ADMIN_EMAIL=admin@exemplo.com
SEED_ADMIN_PASSWORD=UmaSenhaDeDemonstracao123
```

O seed cria o administrador, além de turista e morador de demonstração. As contas demonstrativas `turista@caragua360.com` e `morador@caragua360.com` usam a senha definida no código original: `Caragua360#2026`. Sem as variáveis de seed, o administrador também usa essa senha e o e-mail `admin@caragua360.com`. Essas credenciais são públicas no código e devem ficar restritas a demonstração local.

Ao repetir o seed, o `upsert` do administrador atualiza o perfil para `ADMIN`, mas **não substitui a senha de uma conta que já existe**. Trocar `SEED_ADMIN_PASSWORD` não redefine a senha existente. O seed também pode acrescentar conteúdo relacionado em novas execuções; não o trate como operação sem efeitos.

O cadastro público aceita somente `TOURIST` e `RESIDENT`. Um administrador autenticado pode gerenciar perfis por `PATCH /api/users/:id`. Não existe cadastro público de `ADMIN`.

As imagens demonstrativas do seed usam URLs `/images/*.jpg`, provenientes do frontend original. Este backend serve uploads em `/uploads`, mas não inclui aquelas imagens. Disponibilize os assets no frontend ou substitua suas URLs se necessário.

## 5. Iniciar e conferir

```powershell
npm.cmd run start:dev
```

Esse comando usa o Nest CLI em modo watch. Mantenha o terminal aberto. A API local estará em `http://localhost:3000/api`.

Em outro terminal:

```powershell
Invoke-RestMethod 'http://localhost:3000/api/health'
Invoke-RestMethod 'http://localhost:3000/api/health/db'
```

Resposta de saúde do processo:

```json
{ "status": "ok", "service": "caragua360" }
```

Resposta de banco conectado:

```json
{ "database": "ok" }
```

O processo pode iniciar sem banco acessível porque a conexão é utilizada sob demanda. Somente `/health/db` ou uma operação com dados confirma o acesso ao banco. Em falha, `/health/db` retorna HTTP 503 e `{ "database": "unavailable" }`.

Não há Swagger configurado em `/docs`. Use o [guia da API](docs/README-API.md), Postman, Insomnia, curl ou PowerShell.

## 6. Frontend, cookies e CORS

Configure a URL base no frontend como `http://localhost:3000/api` e `PUBLIC_SITE_URL` no backend com a origem exata do frontend, por exemplo `http://localhost:5173`. Reinicie o backend após editar o `.env`.

Em chamadas por cookie, use `credentials: 'include'` no `fetch`. Em desenvolvimento o cookie é `HttpOnly`, `SameSite=Lax`, sem `Secure`. Use o mesmo nome de host nos dois lados: misturar `localhost` e `127.0.0.1` pode alterar o comportamento dos cookies.

Em produção o cookie é `Secure` e `SameSite=None`, exigindo HTTPS. O navegador pode bloquear cookies de terceiros mesmo com essas opções; a API também aceita Bearer. Se um Bearer estiver presente, ele tem prioridade sobre o cookie.

URLs de upload retornadas como `/uploads/roteiros/arquivo.jpg` são relativas à origem do backend. No frontend, monte `http://localhost:3000` + a URL relativa, e não acrescente `/api` antes de `/uploads`.

## 7. SMTP e recuperação de senha

Configure `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` e um remetente autorizado em `SMTP_FROM`. O backend não cria contas SMTP. Solicite a recuperação com `POST /api/auth/forgot-password`; o link aponta para `/redefinir-senha?token=...` no site escolhido pelo serviço.

Sem SMTP, o código imprime o link no console e pode retorná-lo como `devLink`. Essa é uma facilidade de desenvolvimento herdada do original: configure SMTP antes de disponibilizar recuperação de senha em produção.

O serviço considera primeiro um cabeçalho `Origin` HTTP/HTTPS com formato aceito; na ausência dele usa `PUBLIC_SITE_URL` e depois a origem da própria requisição. Configure a URL do site e envie a origem correta ao testar esse fluxo. A página `/redefinir-senha` pertence ao frontend, não é uma página servida pelo backend.

## 8. Balneabilidade

Defina a URL de um provedor que retorne uma lista, ou um objeto contendo a lista em `beaches`/`data`. Exemplo de formato:

```json
{
  "beaches": [
    { "name": "Praia Exemplo", "status": "propria", "measuredAt": "2026-11-12T00:00:00.000Z", "sourceUrl": "https://exemplo.com/boletim" }
  ]
}
```

O serviço também reconhece `beach` para nome, `situation` para condição e `date` para data. Faz a correspondência pelo nome normalizado com destinos da categoria `PRAIA`. Nomes/formatos de situação não reconhecidos podem resultar em `NAO_AVALIADA`.

Faça login como administrador e execute `POST /api/admin/balneabilidade/sync`. Depois consulte `GET /api/balneabilidade`. Não há agendamento automático implementado. Sem URL, a sincronização retorna 503 `BALNEABILITY_NOT_CONFIGURED`.

O resultado da última tentativa de sincronização fica na memória do processo; os registros coletados ficam no PostgreSQL. Reiniciar o processo perde esse estado de tentativa, não os registros salvos.

## 9. Compilar, testar e executar em produção

```powershell
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
$env:NODE_ENV = 'production'
npm.cmd start
```

Configure as variáveis no ambiente de hospedagem ou em um `.env` local protegido. Variáveis já definidas no processo têm precedência sobre o carregamento padrão de dotenv. `npm start` não define `NODE_ENV=production` automaticamente.

O servidor escuta em `0.0.0.0` e na porta de `PORT`. Se usar proxy, o código confia em um salto (`trust proxy = 1`). Configure HTTPS e a URL pública do frontend. Disponibilize armazenamento persistente para `UPLOAD_DIR`: disco temporário de hospedagem perde uploads em novos deploys.

Os sete testes HTTP usam substitutos de consultas Prisma em memória. Verificam rotas, sessão, permissões, validações e erros de upload; não comprovam PostgreSQL, envio SMTP ou acesso real ao provedor de balneabilidade. Essas integrações precisam de verificação no ambiente configurado.

O Prisma 6.19 foi mantido para compatibilidade. A auditoria realizada na migração encontrou alertas em sua cadeia de dependências. A migração para outra versão principal exige revisão de configuração; não aplique `npm audit fix --force` sem analisar as mudanças.

### Scripts disponíveis

| Comando | Finalidade |
| --- | --- |
| `npm.cmd ci` | Instalar exatamente o lockfile. |
| `npm.cmd run start:dev` | Compilar e reiniciar durante desenvolvimento. |
| `npm.cmd run build` | Compilar TypeScript para `dist`. |
| `npm.cmd start` | Executar `dist/main.js` já compilado. |
| `npm.cmd run typecheck` | Conferir tipos sem gerar arquivos. |
| `npm.cmd test` | Compilar e executar os testes de `test/*.test.cjs`. |
| `npm.cmd run format` | Aplicar Prettier aos fontes e testes. |
| `npm.cmd run db:generate` | Gerar o cliente Prisma. |
| `npm.cmd run db:migrate` | Aplicar migrations existentes. |
| `npm.cmd run db:seed` | Executar seed usando variáveis já exportadas. |

## 10. Problemas comuns

| Sintoma | O que conferir |
| --- | --- |
| PowerShell bloqueia `npm.ps1` | Use `npm.cmd`/`npx.cmd`. |
| `EADDRINUSE` | A porta está ocupada; encerre o outro processo ou altere `PORT` e reinicie. |
| Prisma P1000/P1001 ou banco indisponível | Usuário, senha, host, porta, banco, SSL, firewall e serviço PostgreSQL ativo. |
| Tabelas não existem | Execute as migrations no banco correto e confira `DATABASE_URL`. |
| Cliente Prisma não inicializado | Execute `npm.cmd run db:generate`. |
| Login retorna 401 | Confira credenciais, usuário ativo e se o seed foi executado no banco correto. |
| Login retorna 429 | Foram acumuladas falhas; aguarde o bloqueio de 15 minutos. |
| Endpoint retorna 403 | Faça login com o perfil exigido; o Bearer não concede permissões diferentes das do usuário no banco. |
| Navegador acusa CORS | Confira a origem exata em `PUBLIC_SITE_URL`, incluindo porta, e reinicie o backend. |
| Postman funciona, navegador não mantém sessão | Confira `credentials`, HTTPS, SameSite e bloqueio de cookies de terceiros. |
| Seed não lê as variáveis | Use `node --env-file=.env database/seed.js` na raiz do projeto. |
| Imagens do seed não aparecem | Os arquivos `/images` pertencem ao frontend original. |
| Upload retorna 415/erro de limite | Use o campo `photo`, um arquivo permitido e no máximo 5 MB. |
| Recuperação não envia e-mail | Sem `SMTP_HOST`, a entrega é simulada. Confira logs e credenciais SMTP. |

Continue em [Como fazer requisições](docs/README-API.md) ou [Como o código funciona](docs/README-CODIGO.md).
