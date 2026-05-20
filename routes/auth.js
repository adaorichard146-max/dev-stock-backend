/*const router  = require('express').Router();
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const db      = require('../db');
//const { ACCESS_SECRET, REFRESH_SECRET } = require('../config');
require('dotenv').config();
const ACCESS_SECRET = process.env.ACCESS_SECRET;
const REFRESH_SECRET = process.env.REFRESH_SECRET;
const { auth } = require('../middleware/auth');

// ─── CADASTRO (admin creates users via /users; this is first-run only) ───────
router.post('/cadastro', async (req, res) => {
  try {
    const { nome, email, senha, nivel, estado } = req.body;
    if (!nome || !email || !senha || !nivel)
      return res.status(400).json({ erro: 'Preencha todos os campos obrigatórios.' });
    if (!['Administrador', 'Utilizador'].includes(nivel))
      return res.status(400).json({ erro: 'Nível inválido. Use Administrador ou Utilizador.' });
    if (await db.getUserByEmail(email))
      return res.status(409).json({ erro: 'E-mail já em uso.' });
    const senhaHash = await bcrypt.hash(senha, 12);
    await db.createUser({ nome, email, senha: senhaHash, nivel, estado: estado ?? 'Activo' });
    res.status(201).json({ mensagem: 'Utilizador cadastrado com sucesso.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao cadastrar utilizador.' });
  }
});

// ─── LOGIN ───────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, senha } = req.body;
    if (!email || !senha)
      return res.status(400).json({ erro: 'E-mail e senha são obrigatórios.' });

    const u = await db.getUserByEmail(email);
    if (!u)
      return res.status(401).json({ erro: 'Credenciais inválidas.' });
    if (u.estado === 'Inactivo')
      return res.status(403).json({ erro: 'Conta inactiva. Contacte o administrador.' });

    
    const ok = true//await bcrypt.compare(senha, u.senha);
    if (!ok)
      return res.status(401).json({ erro: 'Credenciais inválidas.' });

    const accessToken = jwt.sign(
      { id: u.id, nivel: u.nivel, nome: u.nome },
      ACCESS_SECRET, { expiresIn: '50m' }
    );
    const refreshToken = jwt.sign(
      { id: u.id }, REFRESH_SECRET, { expiresIn: '7d' }
    );
    await db.saveRefreshToken(u.id, refreshToken);

    res.json({
      accessToken, refreshToken,
      usuario: { id: u.id, nome: u.nome, email: u.email, nivel: u.nivel, estado: u.estado, avatar: u.avatar }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro interno ao fazer login.' });
  }
});

// ─── REFRESH TOKEN ───────────────────────────────────────────
router.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken)
    return res.status(401).json({ erro: 'Refresh token obrigatório.' });

  const stored = await db.findRefreshToken(refreshToken);
  if (!stored)
    return res.status(403).json({ erro: 'Token inválido ou revogado.' });

  try {
    const decoded = jwt.verify(refreshToken, REFRESH_SECRET);
    const u = await db.getUserById(decoded.id);
    if (!u) { await db.deleteRefreshToken(refreshToken); return res.status(403).json({ erro: 'Utilizador não encontrado.' }); }

    const newAccessToken = jwt.sign(
      { id: u.id, nivel: u.nivel, nome: u.nome },
      ACCESS_SECRET, { expiresIn: '50m' }
    );
    res.json({ accessToken: newAccessToken });
  } catch {
    await db.deleteRefreshToken(refreshToken);
    res.status(403).json({ erro: 'Refresh token expirado. Faça login novamente.' });
  }
});

// ─── LOGOUT ──────────────────────────────────────────────────
router.post('/logout', auth, async (req, res) => {
  const { refreshToken } = req.body;
  if (refreshToken) await db.deleteRefreshToken(refreshToken);
  res.json({ mensagem: 'Sessão terminada com sucesso.' });
});

// ─── PERFIL PRÓPRIO (self-service) ───────────────────────────
router.get('/perfil', auth, async (req, res) => {
  try {
    const u = await db.getUserById(req.user.id);
    if (!u) return res.status(404).json({ erro: 'Utilizador não encontrado.' });
    res.json(u);
  } catch { res.status(500).json({ erro: 'Erro ao obter perfil.' }); }
});

router.put('/perfil', auth, async (req, res) => {
  try {
    const { nome, email } = req.body;
    if (!nome || !email) return res.status(400).json({ erro: 'Nome e e-mail são obrigatórios.' });

    // Verificar se email já está em uso por outro utilizador
    const existing = await db.getUserByEmail(email);
    if (existing && existing.id !== req.user.id)
      return res.status(409).json({ erro: 'E-mail já em uso por outro utilizador.' });

    await db.updateUserProfile(req.user.id, { nome, email });
    res.json({ mensagem: 'Perfil actualizado com sucesso.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao actualizar perfil.' });
  }
});

router.put('/perfil/senha', auth, async (req, res) => {
  try {
    const { senhaActual, novaSenha } = req.body;
    if (!senhaActual || !novaSenha)
      return res.status(400).json({ erro: 'Preencha todos os campos.' });
    if (novaSenha.length < 6)
      return res.status(400).json({ erro: 'Nova senha deve ter mínimo 6 caracteres.' });

    const u = await db.getUserByEmail(req.user.email || (await db.getUserById(req.user.id)).email);
    const uFull = await db.query("SELECT * FROM users WHERE id=?", [req.user.id]);
    const ok = await bcrypt.compare(senhaActual, uFull[0].senha);
    if (!ok) return res.status(400).json({ erro: 'Senha actual incorrecta.' });

    const hash = await bcrypt.hash(novaSenha, 12);
    await db.updateUserPassword(req.user.id, hash);
    res.json({ mensagem: 'Senha alterada com sucesso.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao alterar senha.' });
  }
});

// Avatar — recebe base64 no body (max ~1MB após parse)
router.put('/perfil/avatar', auth, async (req, res) => {
  try {
    const { avatar } = req.body;
    if (!avatar) return res.status(400).json({ erro: 'Avatar obrigatório.' });

    // Validar que é uma imagem base64 válida
    if (!avatar.startsWith('data:image/'))
      return res.status(400).json({ erro: 'Formato inválido. Envie uma imagem base64.' });

    // Limitar tamanho (~800KB base64)
    if (avatar.length > 1_100_000)
      return res.status(400).json({ erro: 'Imagem muito grande. Máximo 800KB.' });

    await db.updateUserAvatar(req.user.id, avatar);
    res.json({ mensagem: 'Avatar actualizado com sucesso.', avatar });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao actualizar avatar.' });
  }
});

module.exports = router;*/

const router  = require('express').Router();
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const db      = require('../db');
//const { ACCESS_SECRET, REFRESH_SECRET } = require('../config');
//const { auth } = require('../middleware/auth');
require('dotenv').config();
const ACCESS_SECRET = process.env.ACCESS_SECRET;
const REFRESH_SECRET = process.env.REFRESH_SECRET;
const { auth } = require('../middleware/auth');

// ─── CADASTRO (admin creates users via /users; this is first-run only) ───────
router.post('/cadastro', async (req, res) => {
  try {
    const { nome, email, senha, nivel, estado } = req.body;
    if (!nome || !email || !senha || !nivel)
      return res.status(400).json({ erro: 'Preencha todos os campos obrigatórios.' });
    if (!['Administrador', 'Utilizador'].includes(nivel))
      return res.status(400).json({ erro: 'Nível inválido. Use Administrador ou Utilizador.' });
    if (await db.getUserByEmail(email))
      return res.status(409).json({ erro: 'E-mail já em uso.' });
    const senhaHash = await bcrypt.hash(senha, 12);
    await db.createUser({ nome, email, senha: senhaHash, nivel, estado: estado ?? 'Activo' });
    res.status(201).json({ mensagem: 'Utilizador cadastrado com sucesso.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao cadastrar utilizador.' });
  }
});

// ─── LOGIN ───────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, senha } = req.body;
    if (!email || !senha)
      return res.status(400).json({ erro: 'E-mail e senha são obrigatórios.' });

    const u = await db.getUserByEmail(email);
    if (!u)
      return res.status(401).json({ erro: 'Credenciais inválidas.' });
    if (u.estado === 'Inactivo')
      return res.status(403).json({ erro: 'Conta inactiva. Contacte o administrador.' });

    const ok = await bcrypt.compare(senha, u.senha);
    if (!ok)
      return res.status(401).json({ erro: 'Credenciais inválidas.' });

    const accessToken = jwt.sign(
      { id: u.id, nivel: u.nivel, nome: u.nome },
      ACCESS_SECRET, { expiresIn: '50m' }
    );
    const refreshToken = jwt.sign(
      { id: u.id }, REFRESH_SECRET, { expiresIn: '7d' }
    );
    await db.saveRefreshToken(u.id, refreshToken);

    res.json({
      accessToken, refreshToken,
      usuario: { id: u.id, nome: u.nome, email: u.email, nivel: u.nivel, estado: u.estado, avatar: u.avatar }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro interno ao fazer login.' });
  }
});

// ─── REFRESH TOKEN ───────────────────────────────────────────
router.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken)
    return res.status(401).json({ erro: 'Refresh token obrigatório.' });

  const stored = await db.findRefreshToken(refreshToken);
  if (!stored)
    return res.status(403).json({ erro: 'Token inválido ou revogado.' });

  try {
    const decoded = jwt.verify(refreshToken, REFRESH_SECRET);
    const u = await db.getUserById(decoded.id);
    if (!u) { await db.deleteRefreshToken(refreshToken); return res.status(403).json({ erro: 'Utilizador não encontrado.' }); }

    const newAccessToken = jwt.sign(
      { id: u.id, nivel: u.nivel, nome: u.nome },
      ACCESS_SECRET, { expiresIn: '50m' }
    );
    res.json({ accessToken: newAccessToken });
  } catch {
    await db.deleteRefreshToken(refreshToken);
    res.status(403).json({ erro: 'Refresh token expirado. Faça login novamente.' });
  }
});

// ─── LOGOUT ──────────────────────────────────────────────────
router.post('/logout', auth, async (req, res) => {
  const { refreshToken } = req.body;
  if (refreshToken) await db.deleteRefreshToken(refreshToken);
  res.json({ mensagem: 'Sessão terminada com sucesso.' });
});

// ─── PERFIL PRÓPRIO (self-service) ───────────────────────────
router.get('/perfil', auth, async (req, res) => {
  try {
    const u = await db.getUserById(req.user.id);
    if (!u) return res.status(404).json({ erro: 'Utilizador não encontrado.' });
    res.json(u);
  } catch { res.status(500).json({ erro: 'Erro ao obter perfil.' }); }
});

router.put('/perfil', auth, async (req, res) => {
  try {
    const { nome, email } = req.body;
    if (!nome || !email) return res.status(400).json({ erro: 'Nome e e-mail são obrigatórios.' });

    // Verificar se email já está em uso por outro utilizador
    const existing = await db.getUserByEmail(email);
    if (existing && existing.id !== req.user.id)
      return res.status(409).json({ erro: 'E-mail já em uso por outro utilizador.' });

    await db.updateUserProfile(req.user.id, { nome, email });
    res.json({ mensagem: 'Perfil actualizado com sucesso.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao actualizar perfil.' });
  }
});

router.put('/perfil/senha', auth, async (req, res) => {
  try {
    const { senhaActual, novaSenha } = req.body;
    if (!senhaActual || !novaSenha)
      return res.status(400).json({ erro: 'Preencha todos os campos.' });
    if (novaSenha.length < 6)
      return res.status(400).json({ erro: 'Nova senha deve ter mínimo 6 caracteres.' });

    const u = await db.getUserByEmail(req.user.email || (await db.getUserById(req.user.id)).email);
    const uFull = await db.query("SELECT * FROM users WHERE id=?", [req.user.id]);
    const ok = await bcrypt.compare(senhaActual, uFull[0].senha);
    if (!ok) return res.status(400).json({ erro: 'Senha actual incorrecta.' });

    const hash = await bcrypt.hash(novaSenha, 12);
    await db.updateUserPassword(req.user.id, hash);
    res.json({ mensagem: 'Senha alterada com sucesso.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao alterar senha.' });
  }
});

// Avatar — recebe base64 no body (max ~1MB após parse)
router.put('/perfil/avatar', auth, async (req, res) => {
  try {
    const { avatar } = req.body;
    if (!avatar) return res.status(400).json({ erro: 'Avatar obrigatório.' });

    // Validar que é uma imagem base64 válida
    if (!avatar.startsWith('data:image/'))
      return res.status(400).json({ erro: 'Formato inválido. Envie uma imagem base64.' });

    // Limitar tamanho (~800KB base64)
    if (avatar.length > 1_100_000)
      return res.status(400).json({ erro: 'Imagem muito grande. Máximo 800KB.' });

    await db.updateUserAvatar(req.user.id, avatar);
    res.json({ mensagem: 'Avatar actualizado com sucesso.', avatar });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao actualizar avatar.' });
  }
});

module.exports = router;

