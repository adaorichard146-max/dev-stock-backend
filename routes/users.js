/**
 * GESTÃO DE UTILIZADORES — apenas Administrador
 * nivel válidos: "Administrador" | "Utilizador"
 *//*
const router = require('express').Router();
const bcrypt = require('bcryptjs');
const db     = require('../db');
const { auth, adminOnly } = require('../middleware/auth');

// GET /users
router.get('/', auth, adminOnly, async (req, res) => {
  try { res.json(await db.getUsers()); }
  catch { res.status(500).json({ erro: 'Erro ao listar utilizadores.' }); }
});

// POST /users
router.post('/', auth, adminOnly, async (req, res) => {
  try {
    const { nome, email, senha, nivel, estado } = req.body;
    if (!nome || !email || !senha || !nivel)
      return res.status(400).json({ erro: 'Campos obrigatórios em falta.' });
    if (!['Administrador', 'Utilizador'].includes(nivel))
      return res.status(400).json({ erro: 'Nível inválido. Use Administrador ou Utilizador.' });
    if (senha.length < 6)
      return res.status(400).json({ erro: 'Senha deve ter mínimo 6 caracteres.' });
    if (await db.getUserByEmail(email))
      return res.status(409).json({ erro: 'E-mail já em uso.' });

    const senhaHash = await bcrypt.hash(senha, 12);
    await db.createUser({ nome, email, senha: senhaHash, nivel, estado: estado ?? 'Activo' });
    res.status(201).json({ mensagem: 'Utilizador criado com sucesso.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao criar utilizador.' });
  }
});

// PUT /users/:id
router.put('/:id', auth, adminOnly, async (req, res) => {
  try {
    const { nome, email, nivel, estado, senha } = req.body;
    if (!['Administrador', 'Utilizador'].includes(nivel))
      return res.status(400).json({ erro: 'Nível inválido.' });

    const existing = await db.getUserByEmail(email);
    if (existing && String(existing.id) !== String(req.params.id))
      return res.status(409).json({ erro: 'E-mail já em uso.' });

    await db.updateUser(req.params.id, { nome, email, nivel, estado });
    if (senha && senha.trim()) {
      if (senha.length < 6) return res.status(400).json({ erro: 'Senha deve ter mínimo 6 caracteres.' });
      await db.updateUserPassword(req.params.id, await bcrypt.hash(senha, 12));
    }
    res.json({ mensagem: 'Utilizador actualizado.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao actualizar utilizador.' });
  }
});

// PATCH /users/:id/estado
router.patch('/:id/estado', auth, adminOnly, async (req, res) => {
  try {
    const { estado } = req.body;
    if (!['Activo', 'Inactivo'].includes(estado))
      return res.status(400).json({ erro: 'Estado inválido.' });
    await db.updateUserState(req.params.id, estado);
    res.json({ mensagem: 'Estado actualizado.' });
  } catch { res.status(500).json({ erro: 'Erro ao actualizar estado.' }); }
});

// DELETE /users/:id
router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    if (String(req.params.id) === String(req.user.id))
      return res.status(400).json({ erro: 'Não pode eliminar a sua própria conta.' });
    await db.deleteAllUserTokens(req.params.id);
    await db.deleteUser(req.params.id);
    res.json({ mensagem: 'Utilizador eliminado.' });
  } catch { res.status(500).json({ erro: 'Erro ao eliminar utilizador.' }); }
});

module.exports = router;*/

/**
 * GESTÃO DE UTILIZADORES — apenas Administrador
 * nivel válidos: "Administrador" | "Utilizador"
 */
const router = require('express').Router();
const bcrypt = require('bcryptjs');
const db     = require('../db');
const { auth, adminOnly } = require('../middleware/auth');

// GET /users
router.get('/', auth, adminOnly, async (req, res) => {
  try { res.json(await db.getUsers()); }
  catch { res.status(500).json({ erro: 'Erro ao listar utilizadores.' }); }
});

// POST /users
router.post('/', auth, adminOnly, async (req, res) => {
  try {
    const { nome, email, senha, nivel, estado } = req.body;
    if (!nome || !email || !senha || !nivel)
      return res.status(400).json({ erro: 'Campos obrigatórios em falta.' });
    if (!['Administrador', 'Utilizador'].includes(nivel))
      return res.status(400).json({ erro: 'Nível inválido. Use Administrador ou Utilizador.' });
    if (senha.length < 6)
      return res.status(400).json({ erro: 'Senha deve ter mínimo 6 caracteres.' });
    if (await db.getUserByEmail(email))
      return res.status(409).json({ erro: 'E-mail já em uso.' });

    const senhaHash = await bcrypt.hash(senha, 12);
    await db.createUser({ nome, email, senha: senhaHash, nivel, estado: estado ?? 'Activo' });
    res.status(201).json({ mensagem: 'Utilizador criado com sucesso.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao criar utilizador.' });
  }
});

// PUT /users/:id
router.put('/:id', auth, adminOnly, async (req, res) => {
  try {
    const { nome, email, nivel, estado, senha } = req.body;
    if (!['Administrador', 'Utilizador'].includes(nivel))
      return res.status(400).json({ erro: 'Nível inválido.' });

    const existing = await db.getUserByEmail(email);
    if (existing && String(existing.id) !== String(req.params.id))
      return res.status(409).json({ erro: 'E-mail já em uso.' });

    await db.updateUser(req.params.id, { nome, email, nivel, estado });
    if (senha && senha.trim()) {
      if (senha.length < 6) return res.status(400).json({ erro: 'Senha deve ter mínimo 6 caracteres.' });
      await db.updateUserPassword(req.params.id, await bcrypt.hash(senha, 12));
    }
    res.json({ mensagem: 'Utilizador actualizado.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao actualizar utilizador.' });
  }
});

// PATCH /users/:id/estado
router.patch('/:id/estado', auth, adminOnly, async (req, res) => {
  try {
    const { estado } = req.body;
    if (!['Activo', 'Inactivo'].includes(estado))
      return res.status(400).json({ erro: 'Estado inválido.' });
    await db.updateUserState(req.params.id, estado);
    res.json({ mensagem: 'Estado actualizado.' });
  } catch { res.status(500).json({ erro: 'Erro ao actualizar estado.' }); }
});

// DELETE /users/:id
router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    if (String(req.params.id) === String(req.user.id))
      return res.status(400).json({ erro: 'Não pode eliminar a sua própria conta.' });
    await db.deleteAllUserTokens(req.params.id);
    await db.deleteUser(req.params.id);
    res.json({ mensagem: 'Utilizador eliminado.' });
  } catch { res.status(500).json({ erro: 'Erro ao eliminar utilizador.' }); }
});

module.exports = router;

