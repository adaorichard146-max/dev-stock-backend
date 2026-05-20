# 📦 Hélio Trading — Sistema de Gestão v2.0

Sistema ERP completo com dois níveis de acesso, gráficos locais, exportação PDF, avatar upload e segurança robusta.

---

## 📁 Estrutura de Ficheiros

```
helio-trading/
├── backend/
│   ├── index.js                  ← Servidor Express (entry point)
│   ├── config.js                 ← Segredos JWT e configurações
│   ├── db.js                     ← Todas as queries MySQL
│   ├── schema.sql                ← Script criação da BD
│   ├── package.json
│   ├── .env.example              ← Variáveis de ambiente
│   ├── middleware/
│   │   └── auth.js               ← JWT verify + autorização por nível
│   └── routes/
│       ├── auth.js               ← /login /refresh /logout /perfil /perfil/avatar
│       ├── users.js              ← CRUD utilizadores (admin only)
│       ├── inventario.js         ← Produtos, Categorias, Fornecedores
│       └── operacoes.js          ← Vendas, Movimentações, Relatórios
│
└── frontend/
    ├── login.html                ← Página de autenticação
    ├── dashboard.html            ← SPA principal (todas as secções)
    └── assets/
        ├── css/
        │   └── app.css           ← Design system completo (sem CDN)
        └── js/
            └── app.js            ← API helper, gráficos Canvas, PDF, utils
```

---

## ⚡ Instalação Rápida

### 1. Base de Dados
```bash
mysql -u root -p < backend/schema.sql
```

**Admin padrão criado automaticamente:**
- Email: `adaorichard146@gmail.com`  `oseiaslerias@gmail.com`
- Senha: `admin123`                  `oseias`

### 2. Backend
```bash
cd backend
cp .env.example .env          # configurar variáveis
npm install
npm run dev                   # desenvolvimento
# ou: npm start               # produção
```

### 3. Frontend
```bash
# Qualquer servidor HTTP estático na pasta frontend/
cd frontend
npx serve .
# Aceder em http://localhost:3000 (ou porta do seu servidor)
```

> **Importante:** O `dashboard.html` faz fetch para `http://localhost:3000`. Se o backend correr noutro porto, edite a variável `API` no topo de `assets/js/app.js`.


---

## 👥 Níveis de Acesso

| Funcionalidade | 👑 Administrador | 👤 Utilizador |
|---|:---:|:---:|
| Dashboard | ✅ Completo | ✅ Básico (sem financeiro) |
| Nova Venda | ✅ | ✅ |
| Ver Produtos | ✅ | ✅ |
| Criar/Editar/Eliminar Produtos | ✅ | ❌ |
| Ver Categorias | ✅ | ✅ |
| Criar/Editar/Eliminar Categorias | ✅ | ❌ |
| Ver Fornecedores | ✅ | ✅ |
| Criar/Editar/Eliminar Fornecedores | ✅ | ❌ |
| Ver Movimentações | ✅ | ✅ |
| Ajuste Manual de Stock | ✅ | ❌ |
| Relatório Financeiro | ✅ | ❌ |
| Relatório de Estoque | ✅ | ❌ |
| Gerir Utilizadores | ✅ | ❌ |
| Editar próprio Perfil | ✅ | ✅ |
| Upload de Avatar | ✅ | ✅ |

---

## 🔐 Segurança

| Mecanismo | Detalhe |
|---|---|
| **bcrypt** | Salt rounds = 12 |
| **JWT Access Token** | Expira em 50 minutos, refresh automático |
| **JWT Refresh Token** | Expira em 7 dias, armazenado na BD |
| **Helmet.js** | Headers HTTP seguros |
| **Rate Limiting** | 300 req/15min geral; 15 req/15min em /login |
| **Validação dupla** | Frontend + Backend (nunca confiar só no frontend) |
| **Autorização por nível** | `Administrador` \| `Utilizador` |
| **Avatar** | Comprimido para JPEG 256×256 no cliente antes de enviar |

---

## 🎨 Design

- **Sem CDN** — todos os estilos e scripts são locais
- **Gráficos** — implementação própria com Canvas API (bar, line, donut)
- **Exportação** — gerador de PNG/relatório com Canvas nativo
- **Fontes** — `Segoe UI` / `system-ui` (locais do sistema)
- **Tema** — Dark com accent gold premium

---

## 🗄️ Tabelas da Base de Dados

| Tabela | Descrição |
|---|---|
| `users` | Utilizadores com `nivel ENUM('Administrador','Utilizador')` e `avatar MEDIUMTEXT` |
| `refresh_tokens` | Tokens de refresh activos por utilizador |
| `categoria` | Categorias de produtos |
| `fornecedor` | Fornecedores |
| `produto` | Produtos com stock mínimo |
| `movimentacao` | Histórico de entradas/saídas |
| `venda` | Cabeçalho de vendas |
| `itemvenda` | Itens de cada venda |

---

## 📡 API — Referência

```
POST   /login              → Autenticar
POST   /refresh            → Renovar access token
POST   /logout             → Terminar sessão
GET    /perfil             → Dados do próprio perfil
PUT    /perfil             → Actualizar nome/email
PUT    /perfil/senha       → Alterar senha
PUT    /perfil/avatar      → Upload avatar (base64)

GET    /users              → Listar utilizadores      [Admin]
POST   /users              → Criar utilizador         [Admin]
PUT    /users/:id          → Editar utilizador        [Admin]
PATCH  /users/:id/estado   → Activar/desactivar       [Admin]
DELETE /users/:id          → Eliminar utilizador      [Admin]

GET    /categorias         → Listar                   [Todos]
POST   /categorias         → Criar                    [Admin]
PUT    /categorias/:id     → Editar                   [Admin]
DELETE /categorias/:id     → Eliminar                 [Admin]

GET    /fornecedores       → Listar                   [Todos]
POST   /fornecedores       → Criar                    [Admin]
PUT    /fornecedores/:id   → Editar                   [Admin]
DELETE /fornecedores/:id   → Eliminar                 [Admin]

GET    /produtos           → Listar                   [Todos]
GET    /produtos/estoque-baixo → Stock crítico        [Todos]
POST   /produtos           → Criar                    [Admin]
PUT    /produtos/:id       → Editar                   [Admin]
DELETE /produtos/:id       → Eliminar                 [Admin]

GET    /movimentacoes      → Listar (filtros opcionais) [Todos]
POST   /movimentacoes      → Ajuste manual            [Admin]

GET    /vendas             → Listar                   [Todos]
POST   /vendas             → Criar venda              [Todos]

GET    /relatorio/financeiro → Rel. financeiro        [Admin]
GET    /relatorio/estoque    → Rel. estoque           [Admin]
```
