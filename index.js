require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
const rateLimit  = require('express-rate-limit');
const { PORT }   = require('./config');

const app = express();
app.set('trust proxy', 1);

// ─── SEGURANÇA ───────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: [
    "http://127.0.0.1:5500",
    "http://localhost:5500",
    "https://devstoque.netlify.app"
  ],
  credentials: true
}));

// Limite geral
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 300, standardHeaders: true, legacyHeaders: false }));

// Limite específico para login (brute-force protection)
app.use('/login', rateLimit({
  windowMs: 15 * 60 * 1000, max: 15,
  message: { erro: 'Demasiadas tentativas. Aguarde 15 minutos.' }
}));

// Body parser — aumentado para suportar avatar base64 (~800KB)
app.use(express.json({ limit: '1.5mb' }));
app.use(express.urlencoded({ extended: true, limit: '1.5mb' }));

// ─── ROTAS ───────────────────────────────────────────────────
app.use('/',            require('./routes/auth'));
app.use('/users',       require('./routes/users'));
app.use('/',            require('./routes/inventario'));
app.use('/',            require('./routes/operacoes'));

// ─── HEALTH ──────────────────────────────────────────────────
app.get('/health', (_, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

// ─── 404 ─────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ erro: `Rota "${req.method} ${req.path}" não encontrada.` }));

// ─── ERROR HANDLER ───────────────────────────────────────────
app.use((err, req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ erro: 'Erro interno do servidor.' });
});

app.listen(PORT, () => {
  console.log(`\n🚀 Servidor Hélio Trading rodando na porta ${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/health\n`);
});

