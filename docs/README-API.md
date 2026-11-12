# Caragua360 — guia de requisições da API

[Configuração](../README.md) · [Explicação do código](README-CODIGO.md)

## 1. Convenções

URL base local: **`http://localhost:3000/api`**. As tabelas usam caminhos completos com `/api`. Substitua `:id` por um ID real sem os dois-pontos; `:slug` é o texto de URL do conteúdo. IDs dos exemplos são ilustrativos: use os IDs retornados pelo seu banco.

Para JSON, envie `Content-Type: application/json`. Para arquivos, envie `multipart/form-data` com campo `photo`. Listagens retornam objetos como `{ "locals": [] }`, e não arrays diretamente. Não há paginação padronizada por `page`/`offset` nem campo global `total`.

Rotas públicas continuam públicas mesmo quando um token inválido é recebido, pois o guard trata a sessão como anônima. Rotas protegidas exigem sessão válida no banco, usuário ativo e token não expirado/revogado. O JWT sozinho, sem o registro de sessão, não autentica.

## 2. Primeiro fluxo completo no PowerShell

Os exemplos abaixo podem ser colados no mesmo terminal. O corpo é convertido para bytes UTF-8 para preservar acentos no Windows PowerShell.

```powershell
$apiBase = 'http://localhost:3000/api'

function Send-CaraguaRequest {
    param(
        [string]$Method = 'GET',
        [Parameter(Mandatory=$true)][string]$Path,
        [object]$Body,
        [switch]$Authenticated
    )
    $requestOptions = @{ Uri = "$apiBase$Path"; Method = $Method }
    if ($Authenticated) {
        $requestOptions.Headers = @{ Authorization = "Bearer $caraguaToken" }
    }
    if ($null -ne $Body) {
        $jsonBody = ConvertTo-Json -InputObject $Body -Depth 20
        $requestOptions.Body = [System.Text.Encoding]::UTF8.GetBytes($jsonBody)
        $requestOptions.ContentType = 'application/json; charset=utf-8'
    }
    Invoke-RestMethod @requestOptions
}

# 1. Conferir processo e banco
Send-CaraguaRequest -Path '/health'
Send-CaraguaRequest -Path '/health/db'

# 2. Cadastrar uma conta de teste; mude o e-mail se já existir
$registration = Send-CaraguaRequest -Method POST -Path '/auth/register' -Body @{
    fullName = 'Maria de Teste'
    email = 'maria.teste@example.com'
    password = 'TesteSeguro123'
    confirmPassword = 'TesteSeguro123'
    role = 'TOURIST'
    city = 'Caraguatatuba'
}
$caraguaToken = $registration.token

# 3. Conferir a sessão e o perfil detalhado
Send-CaraguaRequest -Path '/auth/me' -Authenticated
Send-CaraguaRequest -Path '/users/me' -Authenticated

# 4. Buscar um destino existente (precisa de seed ou cadastro pelo admin)
$destinations = Send-CaraguaRequest -Path '/locals?category=PRAIA&limit=10'
if ($destinations.locals.Count -gt 0) {
    $localId = $destinations.locals[0].id
    Send-CaraguaRequest -Path "/locals/$localId" -Authenticated
    $favorite = Send-CaraguaRequest -Method POST -Path '/favorites' -Authenticated -Body @{ localId = $localId }
    Send-CaraguaRequest -Path '/favorites' -Authenticated
    Send-CaraguaRequest -Method DELETE -Path "/favorites/$($favorite.favorite.id)" -Authenticated
}

# Para sair, execute ao terminar os outros exemplos:
# Send-CaraguaRequest -Method POST -Path '/auth/logout' -Authenticated
```

O cadastro retorna HTTP 201 com `{ user, token }` e também grava um cookie. Para reutilizar uma conta, faça login:

```powershell
$login = Send-CaraguaRequest -Method POST -Path '/auth/login' -Body @{
    email = 'maria.teste@example.com'
    password = 'TesteSeguro123'
}
$caraguaToken = $login.token
```

## 3. Postman, Insomnia e curl

No Postman/Insomnia, crie `baseUrl = http://localhost:3000/api`. Execute `POST {{baseUrl}}/auth/login` com Body JSON de e-mail e senha. Copie `token` da resposta. Nas rotas protegidas, selecione **Bearer Token** e cole o token. O gerenciador de cookies também pode reaproveitar `caragua_session`.

Exemplo curl no PowerShell, utilizando arquivo para evitar diferenças de escape de JSON entre versões do terminal:

```powershell
@'
{"email":"maria.teste@example.com","password":"TesteSeguro123"}
'@ | Set-Content -Encoding ascii login.json
curl.exe -i -X POST 'http://localhost:3000/api/auth/login' -H 'Content-Type: application/json' --data-binary '@login.json'

# Substitua TOKEN_AQUI pelo token retornado
curl.exe -i 'http://localhost:3000/api/users/me' -H 'Authorization: Bearer TOKEN_AQUI'
```

Para usar cookies com curl, acrescente `-c cookies.txt` no login e `-b cookies.txt` nas requisições seguintes. Arquivos com token/cookie são credenciais: mantenha-os locais.

## 4. Autenticação e permissões

| Acesso na referência | Significado |
| --- | --- |
| Público | Não exige login; em alguns detalhes a visibilidade ainda depende do estado do conteúdo. |
| Autenticado | Qualquer usuário ativo com sessão válida. |
| ADMIN | Administrador autenticado. |
| RESIDENT ou ADMIN | Morador ou administrador autenticado. |

O guard verifica o perfil atual no banco. Há também regras de propriedade no service: conhecer um ID não permite editar roteiros, avaliações, comentários ou favoritos de outro usuário.

Sessão dura 7 dias. O logout revoga a sessão corrente. A troca de senha revoga as outras sessões, mantendo a corrente; redefinir senha pelo token revoga todas. Não existe endpoint de refresh token.

`GET /auth/me` retorna `{ "user": null }` com HTTP 200 para visitante. `GET /users/me` retorna 401 para visitante e, quando autenticado, traz perfil com estatísticas.

### Senha esquecida e troca de senha

```powershell
Send-CaraguaRequest -Method POST -Path '/auth/forgot-password' -Body @{ email = 'maria.teste@example.com' }

# Copie o token recebido no link; não é o JWT de login.
Send-CaraguaRequest -Method POST -Path '/auth/reset-password' -Body @{
    token = 'TOKEN_DO_LINK_DE_RECUPERACAO'
    password = 'NovaSenhaSegura123'
    confirmPassword = 'NovaSenhaSegura123'
}

# Após login, para alterar sabendo a senha atual:
Send-CaraguaRequest -Method POST -Path '/auth/change-password' -Authenticated -Body @{
    currentPassword = 'NovaSenhaSegura123'
    password = 'OutraSenhaSegura123'
    confirmPassword = 'OutraSenhaSegura123'
}
```

Senha de cadastro/troca/redefinição: 8 a 72 caracteres, ao menos uma letra e um número; confirmação precisa ser igual. O link de recuperação expira em 24 horas e só pode ser usado uma vez. Sem SMTP, pode aparecer `devLink`; consulte a configuração antes de testar.

## 5. Catálogo completo de endpoints

Os códigos da coluna HTTP são os de **sucesso** configurados nos controllers. Falhas têm códigos próprios, descritos adiante. `—` significa sem corpo JSON obrigatório. Um schema é explicado na seção de payloads. As duas primeiras rotas são adicionais às 77 migradas.

| Método | Caminho | Acesso | HTTP | Entrada |
| --- | --- | --- | --- | --- |
| GET | `/api/health` | Público | 200 | — |
| GET | `/api/health/db` | Público | 200 ou 503 | — |
| POST | `/api/auth/register` | Público | 201 | `registerSchema` |
| POST | `/api/auth/login` | Público | 200 | `loginSchema` |
| POST | `/api/auth/logout` | Público | 200 | `—` |
| GET | `/api/auth/me` | Público | 200 | `—` |
| POST | `/api/auth/forgot-password` | Público | 200 | `forgotPasswordSchema` |
| POST | `/api/auth/reset-password` | Público | 200 | `resetPasswordSchema` |
| POST | `/api/auth/change-password` | Autenticado | 200 | `changePasswordSchema` |
| GET | `/api/users/me` | Autenticado | 200 | `—` |
| PUT | `/api/users/me` | Autenticado | 200 | `updateProfileSchema` |
| DELETE | `/api/users/me` | Autenticado | 200 | `—` |
| POST | `/api/users/me/photo` | Autenticado | 200 | `multipart: photo` |
| GET | `/api/users` | ADMIN | 200 | `—` |
| PATCH | `/api/users/:id` | ADMIN | 200 | `role / isActive` |
| POST | `/api/uploads` | Autenticado | 201 | `multipart: photo` |
| GET | `/api/locals` | Público | 200 | `listQuerySchema` |
| GET | `/api/locals/random` | Público | 200 | `—` |
| GET | `/api/locals/:id` | Autenticado | 200 | `—` |
| POST | `/api/locals` | ADMIN | 201 | `localSchema` |
| PUT | `/api/locals/:id` | ADMIN | 200 | `localSchema` |
| DELETE | `/api/locals/:id` | ADMIN | 200 | `—` |
| GET | `/api/accommodations` | Público | 200 | `—` |
| GET | `/api/accommodations/:id` | Autenticado | 200 | `—` |
| POST | `/api/accommodations` | ADMIN | 201 | `accommodationSchema` |
| PUT | `/api/accommodations/:id` | ADMIN | 200 | `accommodationSchema` |
| DELETE | `/api/accommodations/:id` | ADMIN | 200 | `—` |
| GET | `/api/restaurants` | Público | 200 | `—` |
| GET | `/api/restaurants/:id` | Autenticado | 200 | `—` |
| POST | `/api/restaurants` | ADMIN | 201 | `restaurantSchema` |
| PUT | `/api/restaurants/:id` | ADMIN | 200 | `restaurantSchema` |
| DELETE | `/api/restaurants/:id` | ADMIN | 200 | `—` |
| GET | `/api/activities` | Público | 200 | `—` |
| GET | `/api/activities/:id` | Autenticado | 200 | `—` |
| POST | `/api/activities` | ADMIN | 201 | `activitySchema` |
| PUT | `/api/activities/:id` | ADMIN | 200 | `activitySchema` |
| DELETE | `/api/activities/:id` | ADMIN | 200 | `—` |
| GET | `/api/events` | Público | 200 | `—` |
| GET | `/api/events/:id` | Autenticado | 200 | `—` |
| POST | `/api/events` | ADMIN | 201 | `eventSchema` |
| PUT | `/api/events/:id` | ADMIN | 200 | `eventSchema` |
| DELETE | `/api/events/:id` | ADMIN | 200 | `—` |
| GET | `/api/itineraries` | Público | 200 | `—` |
| GET | `/api/itineraries/mine` | Autenticado | 200 | `—` |
| POST | `/api/itineraries` | Autenticado | 201 | `itinerarySchema` |
| GET | `/api/itineraries/:id` | Público | 200 | `—` |
| PUT | `/api/itineraries/:id` | Autenticado | 200 | `itinerarySchema` |
| DELETE | `/api/itineraries/:id` | Autenticado | 200 | `—` |
| POST | `/api/itineraries/:id/submit` | Autenticado | 200 | `—` |
| POST | `/api/itineraries/:id/like` | Autenticado | 200 | `—` |
| GET | `/api/reviews` | Autenticado | 200 | `—` |
| POST | `/api/reviews` | Autenticado | 201 | `reviewSchema` |
| PUT | `/api/reviews/:id` | Autenticado | 200 | `reviewUpdateSchema` |
| DELETE | `/api/reviews/:id` | Autenticado | 200 | `—` |
| GET | `/api/comments` | Autenticado | 200 | `—` |
| POST | `/api/comments` | Autenticado | 201 | `commentSchema` |
| DELETE | `/api/comments/:id` | Autenticado | 200 | `—` |
| GET | `/api/favorites` | Autenticado | 200 | `—` |
| POST | `/api/favorites` | Autenticado | 201 | `favoriteSchema` |
| DELETE | `/api/favorites/:id` | Autenticado | 200 | `—` |
| GET | `/api/sustainability` | Público | 200 | `—` |
| GET | `/api/sustainability/:slug` | Público | 200 | `—` |
| GET | `/api/admin/sustainability` | ADMIN | 200 | `—` |
| POST | `/api/sustainability` | ADMIN | 201 | `sustainabilitySchema` |
| PUT | `/api/sustainability/:id` | ADMIN | 200 | `sustainabilitySchema` |
| DELETE | `/api/sustainability/:id` | ADMIN | 200 | `—` |
| POST | `/api/suggestions` | RESIDENT ou ADMIN | 201 | `suggestionSchema` |
| GET | `/api/suggestions/mine` | Autenticado | 200 | `—` |
| GET | `/api/balneabilidade` | Público | 200 | `—` |
| GET | `/api/admin/stats` | ADMIN | 200 | `—` |
| GET | `/api/admin/users` | ADMIN | 200 | `—` |
| GET | `/api/admin/itineraries/pending` | ADMIN | 200 | `—` |
| GET | `/api/admin/itineraries` | ADMIN | 200 | `—` |
| PATCH | `/api/admin/itineraries/:id/approve` | ADMIN | 200 | `—` |
| PATCH | `/api/admin/itineraries/:id/reject` | ADMIN | 200 | `rejectSchema` |
| GET | `/api/admin/suggestions` | ADMIN | 200 | `—` |
| PATCH | `/api/admin/suggestions/:id/:action` | ADMIN | 200 | `note (opcional)` |
| GET | `/api/admin/balneabilidade` | ADMIN | 200 | `—` |
| POST | `/api/admin/balneabilidade/sync` | ADMIN | 200 | `—` |


### Consultas e identificadores

| Recurso | Consulta suportada / observações |
| --- | --- |
| `/locals` | `q`, `category`, `neighborhood`, `limit`. Pipe valida e converte `limit` para inteiro de 1 a 100; padrão 100. |
| `/locals/random` | Retorna `{ local: { id, slug } }`; 404 quando não há destino ativo. |
| `/locals/:id` | Aceita ID numérico ou slug; exige login. |
| `/accommodations` | O service lê `q`, `neighborhood`, `limit`; padrão 50. |
| `/restaurants` | O service lê `q`, `neighborhood`, `cuisine`, `limit`; padrão 50. |
| `/activities` e `/events` | O service lê `q`, `limit`; padrão 50. |
| Detalhes de hospedagem, restaurante, atividade e evento | Aceitam ID ou slug; exigem login. |
| `/itineraries` | `q`; lista somente aprovados e publicados. |
| `/itineraries/:id` | ID numérico. Visitante vê somente aprovado/publicado; proprietário e ADMIN podem acessar os demais conforme as regras do service. |
| `/reviews` e `/comments` | Envie `localId=ID` ou `itineraryId=ID`; ausência de ambos retorna 400 `TARGET_REQUIRED`. |
| `/sustainability` | `category`, com valor do enum; lista somente publicados. Detalhe usa slug. |
| `/admin/itineraries` | `status`: `DRAFT`, `PENDING`, `APPROVED`, `REJECTED`. |
| `/admin/suggestions` | `status`: `PENDING`, `APPROVED`, `REJECTED`. |

Somente `/locals` aplica `listQuerySchema` no controller atual. Nas outras listagens, os parâmetros são lidos diretamente e não têm a mesma validação/conversão. Em particular, `limit` chega como texto na URL e pode falhar na consulta Prisma fora de `/locals`; omita-o nessas rotas até implementar a conversão. Não assuma que filtros desconhecidos sejam validados ou que todos os erros de query retornem 422.

Encode textos com espaços/acentos na URL; no JavaScript use `URLSearchParams`. As buscas `contains` usam a configuração de comparação do PostgreSQL, sem tratamento explícito de caixa no código.

## 6. Corpos JSON por operação

Todos os exemplos a seguir são corpos para Body → raw → JSON no Postman, ou para `-Body` do helper PowerShell. Ao atualizar por `PUT`, os endpoints de conteúdo e roteiro reutilizam o schema de criação: envie novamente os campos obrigatórios. Perfil é uma exceção, pois seu schema permite campos opcionais.

### Perfil e administração de usuários

`updateProfileSchema` — `PUT /users/me`:

```json
{ "fullName": "Maria de Teste", "city": "Caraguatatuba", "neighborhood": "Centro", "photoUrl": null }
```

Todos os campos são opcionais. `fullName`: 3–160 caracteres; `city`/`neighborhood`: até 120 e aceitam null; `photoUrl`: até 500 e aceita null. Não atualiza e-mail nem perfil de acesso.

`PATCH /users/:id` — ADMIN:

```json
{ "role": "RESIDENT", "isActive": true }
```

Ambos são opcionais. Perfis válidos: `TOURIST`, `RESIDENT`, `ADMIN`. `DELETE /users/me` anonimiza a conta e revoga sessões; não exige corpo. Os conteúdos históricos são preservados conforme as relações do banco.

### Destino — `localSchema`

`POST /locals` ou `PUT /locals/:id`, somente ADMIN:

```json
{
  "name": "Praia de Exemplo",
  "category": "PRAIA",
  "description": "Destino de exemplo para conhecer a orla da cidade.",
  "neighborhood": "Centro",
  "address": "Avenida da Praia, 100",
  "latitude": -23.62,
  "longitude": -45.41,
  "access": "Acesso pela avenida principal",
  "accessibility": "Rampa de acesso",
  "capacity": "Moderada",
  "sea": "Calmo",
  "structure": "Quiosques",
  "profile": "Famílias",
  "characteristics": { "estacionamento": true },
  "isActive": true,
  "photos": ["/uploads/roteiros/exemplo.jpg"]
}
```

Obrigatórios: `name` (2–160), `category` (`PRAIA`, `TRILHA`, `CACHOEIRA`, `PONTO`), `description` (10–8000). Os demais são opcionais; campos textuais de localização/estrutura aceitam null. Latitude: −90 a 90; longitude: −180 a 180. `characteristics` é objeto JSON ou null. `photos`: até 10 URLs, cada uma com até 500 caracteres.

Nome gera slug na criação. Excluir destino faz inativação (`isActive=false`), preservando histórico. Em atualização, fotos não vazias substituem as existentes; array vazio não deve ser entendido como remoção garantida de todas as fotos.

### Hospedagem — `accommodationSchema`

`POST /accommodations` ou `PUT /accommodations/:id`, ADMIN:

```json
{
  "name": "Pousada Exemplo",
  "category": "Pousada",
  "description": "Hospedagem próxima da praia e do centro da cidade.",
  "neighborhood": "Centro",
  "address": "Rua Exemplo, 20",
  "contactPhone": "12999999999",
  "contactEmail": "contato@example.com",
  "website": "https://example.com",
  "amenities": ["Wi-Fi", "Estacionamento"],
  "priceRange": "R$ 200–400",
  "isActive": true,
  "photos": []
}
```

Obrigatórios: `name` (2–160), `description` (10–5000). Categoria: `Hotel` ou `Pousada`, padrão `Pousada`. Amenidades: até 20 textos com no máximo 80 caracteres cada. Contato por e-mail precisa ser válido quando preenchido. Demais campos são opcionais; `photos` segue o limite de 10 URLs.

### Restaurante — `restaurantSchema`

`POST /restaurants` ou `PUT /restaurants/:id`, ADMIN:

```json
{
  "name": "Restaurante Exemplo",
  "description": "Restaurante de culinária local com pratos variados.",
  "neighborhood": "Centro",
  "address": "Rua Exemplo, 30",
  "contact": "12999999999",
  "cuisine": "Caiçara",
  "openingHours": { "segunda": "11:00–15:00", "sabado": "11:00–22:00" },
  "priceRange": "R$ 50–100",
  "isActive": true,
  "photos": []
}
```

Obrigatórios: `name` (2–160), `description` (10–5000). `openingHours` é objeto cujos valores são textos de até 120 caracteres; demais campos opcionais.

### Atividade — `activitySchema`

`POST /activities` ou `PUT /activities/:id`, ADMIN:

```json
{
  "name": "Passeio de exemplo",
  "description": "Passeio acompanhado para conhecer a região da praia.",
  "neighborhood": "Centro",
  "location": "Ponto de encontro na orla",
  "contact": "12999999999",
  "schedule": "Sábado às 09:00",
  "priceInfo": "Consultar operador",
  "isActive": true,
  "photos": []
}
```

Obrigatórios: `name` (2–160), `description` (10–5000). Demais campos opcionais. `schedule` é texto, não um agendamento executado pelo servidor.

### Evento — `eventSchema`

`POST /events` ou `PUT /events/:id`, ADMIN:

```json
{
  "name": "Evento de exemplo",
  "description": "Evento cultural aberto ao público no centro da cidade.",
  "startDate": "2027-01-15T12:00:00-03:00",
  "endDate": "2027-01-15T18:00:00-03:00",
  "time": "12h às 18h",
  "place": "Praça Central",
  "address": "Centro",
  "entryInfo": "Entrada gratuita",
  "isActive": true,
  "photos": []
}
```

Obrigatórios: `name`, `description`, `startDate`, `place` (2–160). Use datas ISO 8601 com fuso explícito. O service rejeita início inválido com 422 `INVALID_DATE`; `endDate` é opcional. Não há validação implementada garantindo que o fim seja depois do início.

### Roteiro — `itinerarySchema`

`POST /itineraries` ou `PUT /itineraries/:id`, usuário autenticado:

```json
{
  "title": "Um dia em Caraguatatuba",
  "description": "Roteiro para conhecer a praia e aproveitar a cidade.",
  "daysCount": 1,
  "startDate": "2027-01-15",
  "endDate": "2027-01-15",
  "coverPhotoUrl": null,
  "days": [
    {
      "dayNumber": 1,
      "notes": "Levar água",
      "places": [
        {
          "placeName": "Praia de exemplo",
          "comments": "Visitar pela manhã",
          "knewPlace": false,
          "visitDate": "2027-01-15",
          "visitTime": "09:00",
          "visitDuration": "2 horas",
          "rating": 5,
          "photos": []
        }
      ]
    }
  ]
}
```

Obrigatórios: título (3–160), descrição (10–5000), `daysCount` (inteiro de 1 a 30). `days` pode ser vazio; se preenchido, seu tamanho precisa ser igual a `daysCount`, e nenhum `dayNumber` pode ultrapassar esse valor. Até 20 lugares por dia e 6 fotos por lugar. Cada lugar exige `placeName` (2–160) e pode receber um `localId` real para vincular um destino cadastrado. Fotos de roteiro são objetos `{ "url": "...", "caption": "..." }`, diferentemente das fotos de conteúdo oficial, que são strings.

Fluxo com o helper PowerShell:

```powershell
# Após criar o roteiro, use o ID devolvido em response.itinerary.id:
$itineraryId = 1  # substitua
Send-CaraguaRequest -Path '/itineraries/mine' -Authenticated
Send-CaraguaRequest -Method POST -Path "/itineraries/$itineraryId/submit" -Authenticated

# Com token de ADMIN:
Send-CaraguaRequest -Path '/admin/itineraries/pending' -Authenticated
Send-CaraguaRequest -Method PATCH -Path "/admin/itineraries/$itineraryId/approve" -Authenticated

# Alternativa à aprovação, enquanto ainda estiver PENDING:
# Send-CaraguaRequest -Method PATCH -Path "/admin/itineraries/$itineraryId/reject" -Authenticated -Body @{ reason = 'Completar a descrição dos lugares.' }

# Em um roteiro aprovado, o mesmo endpoint alterna curtir/descurtir:
Send-CaraguaRequest -Method POST -Path "/itineraries/$itineraryId/like" -Authenticated
```

Estados: criação em `DRAFT`; envio pelo proprietário passa para `PENDING` se houver pelo menos um lugar. Somente pendentes podem ser aprovados/rejeitados. Em `PENDING`, a edição é bloqueada. Editar um aprovado retorna para `DRAFT` e remove a publicação. Rejeitados podem ser reenviados. Aprovar preenche `publishedAt`; rejeitar exige `reason` (3–1000) e remove a publicação.

Edição/exclusão são permitidas ao proprietário ou ADMIN. Enviar para análise exige ser o proprietário, inclusive quando quem chama é administrador. `PUT` recria os dias e lugares enviados; use o conteúdo completo que deseja preservar.

### Avaliações, comentários e favoritos

`reviewSchema` — `POST /reviews`:

```json
{ "localId": 1, "rating": 5, "comment": "Ótimo passeio." }
```

Informe **exatamente um** entre `localId` e `itineraryId`, ambos inteiros positivos. `rating` é obrigatório, inteiro de 1 a 5; `comment` opcional, até 2000 caracteres. Só há uma avaliação por usuário/alvo; duplicação retorna 409 `REVIEW_EXISTS`.

`reviewUpdateSchema` — `PUT /reviews/:id`:

```json
{ "rating": 4, "comment": "Atualizei minha avaliação." }
```

Para listar: `GET /reviews?localId=1` ou `GET /reviews?itineraryId=1`. A resposta tem `{ reviews, average }`; a média pode ser null se não houver avaliações. Edição/exclusão exigem proprietário ou ADMIN.

`commentSchema` — `POST /comments`:

```json
{ "localId": 1, "content": "Gostaria de visitar novamente." }
```

Use exatamente um alvo, como nas avaliações. `content`: 2–2000 caracteres. Liste por `GET /comments?localId=1` ou `?itineraryId=1`. Exclua pelo ID do comentário, sendo proprietário ou ADMIN. Não existe rota de edição de comentário.

`favoriteSchema` — `POST /favorites`:

```json
{ "localId": 1 }
```

Envie exatamente um entre `localId`, `accommodationId`, `restaurantId`, `itineraryId`. Roteiro precisa estar aprovado para ser favoritado. Duplicação retorna 409 `ALREADY_FAVORITE`. `DELETE /favorites/:id` usa o **ID do favorito**, não o ID do destino/roteiro, e só permite ao dono removê-lo.

### Sustentabilidade — `sustainabilitySchema`

`POST /sustainability` ou `PUT /sustainability/:id`, ADMIN:

```json
{
  "title": "Cuide das praias",
  "category": "DICA",
  "summary": "Recolha os resíduos ao terminar o passeio.",
  "content": "Leve um saco para recolher seus resíduos e descarte no local adequado.",
  "imageUrl": null,
  "published": true
}
```

Obrigatórios: título (3–160), categoria, resumo (5–500), conteúdo (10–8000). Categorias: `DICA`, `ORIENTACAO`, `CAMPANHA`, `PROJETO`, `DESCARTE`. `imageUrl` (até 500, aceita null) e `published` são opcionais. O detalhe público usa slug: `/sustainability/cuide-das-praias`; escrita usa ID numérico. A listagem administrativa inclui não publicados.

### Sugestão — `suggestionSchema`

`POST /suggestions`, RESIDENT ou ADMIN:

```json
{
  "type": "DICA",
  "title": "Sugestão de passeio",
  "description": "Sugiro incluir um passeio guiado pelo centro histórico."
}
```

Tipos: `NOVO_PONTO`, `CORRECAO`, `DICA`, `RECOMENDACAO`. Título: 3–160; descrição: 10–4000. `localId` é opcional, positivo ou null. `GET /suggestions/mine` lista as sugestões do usuário autenticado.

O administrador aprova com `PATCH /admin/suggestions/:id/approve` ou rejeita com `PATCH /admin/suggestions/:id/reject`, podendo enviar `{ "note": "Observação da análise" }`. Só sugestões pendentes podem ser analisadas. A aprovação altera o estado da sugestão; não cria automaticamente um destino nem aplica sua correção ao catálogo.

## 7. Upload de imagem

Exemplo para um arquivo real no Windows:

```powershell
curl.exe -i -X POST 'http://localhost:3000/api/uploads' -H "Authorization: Bearer $caraguaToken" -F 'photo=@C:\caminho\foto.jpg' -F 'folder=roteiros'
```

Não defina manualmente `Content-Type` no multipart: curl/Postman precisam montar o boundary. No Postman, selecione form-data, adicione `photo` como **File** e `folder` como texto.

Resposta de `/uploads`: HTTP 201 com `{ "url": "/uploads/roteiros/arquivo.jpg" }`. `folder=perfil` escolhe a pasta de perfil; outros valores usam `roteiros`. Isso apenas armazena o arquivo: para associá-lo a um conteúdo, envie a URL retornada no JSON do conteúdo.

Para foto do próprio perfil, envie o mesmo multipart para `POST /users/me/photo`. Essa rota armazena a foto e atualiza o usuário, retornando `{ user, photoUrl }`. Consulte a tabela para seu código HTTP de sucesso.

Tipos aceitos pelo filtro MIME: JPEG, PNG, WEBP e GIF. Limite: um arquivo, até 5 MB. O filtro atual usa o MIME informado no multipart; não faz uma inspeção completa do conteúdo binário da imagem. Sem arquivo retorna 400 `FILE_REQUIRED`; tipo não permitido retorna 415. Excesso de tamanho passa pelo tratamento de upload, e o envelope pode vir como `HTTP_ERROR` quando o interceptor Nest converte a exceção.

## 8. Exemplo com fetch no frontend

```javascript
const apiBase = 'http://localhost:3000/api';

async function apiRequest(path, { token, body, ...options } = {}) {
  const response = await fetch(`${apiBase}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message ?? `HTTP ${response.status}`);
  return data;
}

const login = await apiRequest('/auth/login', {
  method: 'POST',
  body: { email: 'maria.teste@example.com', password: 'TesteSeguro123' },
});
const profile = await apiRequest('/users/me', { token: login.token });
const query = new URLSearchParams({ q: 'praia', category: 'PRAIA', limit: '10' });
const destinations = await apiRequest(`/locals?${query}`);

// Upload: use FormData diretamente, sem o helper JSON acima.
async function uploadPhoto(file, token) {
  const form = new FormData();
  form.append('photo', file);
  const response = await fetch(`${apiBase}/uploads`, {
    method: 'POST', credentials: 'include',
    headers: { Authorization: `Bearer ${token}` }, body: form,
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message ?? 'Falha no upload');
  return new URL(data.url, 'http://localhost:3000').href;
}
```

O exemplo mantém o token em uma variável. Para usar apenas cookie, omita o Bearer e mantenha `credentials: 'include'`. Confira a origem em `PUBLIC_SITE_URL` se o frontend estiver em outra porta/domínio.

## 9. Consultas administrativas e balneabilidade

Para testar as rotas administrativas, autentique uma conta ADMIN criada no seu banco. Exemplo para a conta configurada no seed:

```powershell
$adminLogin = Send-CaraguaRequest -Method POST -Path '/auth/login' -Body @{
    email = 'admin@exemplo.com'          # use SEED_ADMIN_EMAIL configurado
    password = 'UmaSenhaDeDemonstracao123'
}
$caraguaToken = $adminLogin.token

Send-CaraguaRequest -Path '/admin/stats' -Authenticated
Send-CaraguaRequest -Path '/admin/users' -Authenticated
Send-CaraguaRequest -Path '/admin/itineraries?status=PENDING' -Authenticated
Send-CaraguaRequest -Path '/admin/suggestions?status=PENDING' -Authenticated
Send-CaraguaRequest -Path '/admin/sustainability' -Authenticated

# Consulta pública e consulta administrativa da integração:
Send-CaraguaRequest -Path '/balneabilidade'
Send-CaraguaRequest -Path '/admin/balneabilidade' -Authenticated

# Faz uma chamada externa e grava os registros recebidos:
# exige BALNEABILITY_API_URL configurada.
Send-CaraguaRequest -Method POST -Path '/admin/balneabilidade/sync' -Authenticated
```

Esse exemplo substitui `$caraguaToken` pelo token administrativo usado no helper. Faça login novamente como turista/morador quando quiser testar esses perfis.

`/admin/stats` retorna `{ stats }`, com contagens em `users`, `locals`, `itineraries`, `pendingItineraries`, `pendingSuggestions`, `events`, `reviews` e `favorites`. As listagens administrativas retornam `{ users }`, `{ itineraries }`, `{ suggestions }` ou `{ contents }`, conforme o recurso.

As consultas de balneabilidade retornam um objeto com `available`, `integrationConfigured`, `source`, `lastUpdated`, `lastSyncAttempt`, `lastError` e `beaches`. O array contém nome da praia, situação, data da medição, fonte, URL da fonte, vínculo com destino e data da coleta. `available` depende da última sincronização bem-sucedida na memória do processo; não indica, sozinho, que o banco está vazio.

Sincronizar retorna `{ success, inserted, beaches, overview }`: `inserted` é a quantidade inserida, `beaches` é a quantidade de entradas da lista recebida e `overview` é a visão atualizada. Não confunda o número `beaches` da sincronização com o array `beaches` da consulta.

## 10. Erros e respostas

Formato de erro de domínio:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Verifique os dados informados.",
    "details": [{ "path": "email", "message": "Informe um e-mail válido." }]
  }
}
```

`details` só aparece quando fornecido pelo erro. Campos e mensagens exatas dependem da operação; não trate o texto como identificador estável. Use o status HTTP e `error.code`.

| HTTP | Situação e códigos comuns |
| --- | --- |
| 200 | Consulta ou operação concluída conforme o controller. |
| 201 | Criação nas rotas indicadas na tabela; nem todo POST usa 201. |
| 400 | ID inválido, alvo ausente, senha atual incorreta ou token de recuperação inválido. |
| 401 | `UNAUTHENTICATED` ou `INVALID_CREDENTIALS`. |
| 403 | `FORBIDDEN`: perfil ou propriedade não permite a operação. |
| 404 | `NOT_FOUND`: registro ausente, conteúdo não visível ou rota inexistente. |
| 409 | Duplicidade, avaliação/favorito existente, conteúdo em análise ou estado incompatível. |
| 413 | Corpo/arquivo excede limite, quando convertido pelo pipeline HTTP. |
| 415 | `UNSUPPORTED_MEDIA`: tipo de upload não permitido. |
| 422 | `VALIDATION_ERROR`, `INVALID_DATE` ou `EMPTY_ITINERARY`. |
| 429 | `LOGIN_BLOCKED`: muitas tentativas de login. |
| 500 | Erro não tratado; mensagem é genérica em produção. |
| 503 | Banco indisponível ou integração de balneabilidade ausente/falhando. |

Não há resposta 204 padronizada: exclusões geralmente retornam JSON `{ "success": true }` e HTTP 200. Não envie corpo em GET. Operações sem corpo obrigatório, como logout, submit, like e approve, podem ser chamadas sem JSON.
