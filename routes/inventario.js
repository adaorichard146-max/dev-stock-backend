/**
 * INVENTÁRIO: Produtos, Categorias, Fornecedores
 *
 * GET  → qualquer utilizador autenticado (Administrador + Utilizador)
 * POST/PUT/DELETE → apenas Administrador
 *//*
const router = require('express').Router();
const db = require('../db');
const { auth, adminOnly } = require('../middleware/auth');

// ─── CATEGORIAS ──────────────────────────────────────────────
router.get('/categorias', auth, async (req, res) => {
  try { res.json(await db.getCategorias()); }
  catch { res.status(500).json({ erro: 'Erro ao listar categorias.' }); }
});
router.post('/categorias', auth, adminOnly, async (req, res) => {
  try {
    if (!req.body.nome?.trim()) return res.status(400).json({ erro: 'Nome é obrigatório.' });
    await db.createCategoria(req.body);
    res.status(201).json({ mensagem: 'Categoria criada.' });
  } catch { res.status(500).json({ erro: 'Erro ao criar categoria.' }); }
});
router.put('/categorias/:id', auth, adminOnly, async (req, res) => {
  try {
    await db.updateCategoria(req.params.id, req.body);
    res.json({ mensagem: 'Categoria actualizada.' });
  } catch { res.status(500).json({ erro: 'Erro ao actualizar categoria.' }); }
});
router.delete('/categorias/:id', auth, adminOnly, async (req, res) => {
  try {
    await db.deleteCategoria(req.params.id);
    res.json({ mensagem: 'Categoria eliminada.' });
  } catch { res.status(500).json({ erro: 'Erro ao eliminar categoria.' }); }
});

// ─── FORNECEDORES ────────────────────────────────────────────
router.get('/fornecedores', auth, async (req, res) => {
  try { res.json(await db.getFornecedores()); }
  catch { res.status(500).json({ erro: 'Erro ao listar fornecedores.' }); }
});
router.post('/fornecedores', auth, adminOnly, async (req, res) => {
  try {
    if (!req.body.nome?.trim()) return res.status(400).json({ erro: 'Nome é obrigatório.' });
    await db.createFornecedor(req.body);
    res.status(201).json({ mensagem: 'Fornecedor criado.' });
  } catch { res.status(500).json({ erro: 'Erro ao criar fornecedor.' }); }
});
router.put('/fornecedores/:id', auth, adminOnly, async (req, res) => {
  try {
    await db.updateFornecedor(req.params.id, req.body);
    res.json({ mensagem: 'Fornecedor actualizado.' });
  } catch { res.status(500).json({ erro: 'Erro ao actualizar fornecedor.' }); }
});
router.delete('/fornecedores/:id', auth, adminOnly, async (req, res) => {
  try {
    await db.deleteFornecedor(req.params.id);
    res.json({ mensagem: 'Fornecedor eliminado.' });
  } catch { res.status(500).json({ erro: 'Erro ao eliminar fornecedor.' }); }
});

// ─── PRODUTOS ────────────────────────────────────────────────
router.get('/produtos', auth, async (req, res) => {
  try { res.json(await db.getProdutos()); }
  catch { res.status(500).json({ erro: 'Erro ao listar produtos.' }); }
});

router.get('/produtos/estoque-baixo', auth, async (req, res) => {
  try { res.json(await db.getProdutosEstoqueBaixo()); }
  catch { res.status(500).json({ erro: 'Erro ao verificar estoque.' }); }
});

router.post('/produtos', auth, adminOnly, async (req, res) => {
  try {
    const { nome, preco, quantidade } = req.body;
    if (!nome?.trim() || preco == null || quantidade == null)
      return res.status(400).json({ erro: 'Nome, preço e quantidade são obrigatórios.' });

    const result = await db.createProduto(req.body);
    // Registo automático de entrada
    await db.createMovimentacao({
      produto_id: result.insertId,
      tipo: 'entrada',
      quantidade: Number(req.body.quantidade),
      motivo: 'Cadastro inicial do produto',
      user_id: req.user.id
    });
    res.status(201).json({ mensagem: 'Produto criado.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao criar produto.' });
  }
});

router.put('/produtos/:id', auth, adminOnly, async (req, res) => {
  try {
    const id = req.params.id;
    const antes = await db.getProdutoById(id);
    if (!antes) return res.status(404).json({ erro: 'Produto não encontrado.' });

    await db.updateProduto(id, req.body);

    const diff = Number(req.body.quantidade) - Number(antes.quantidade);
    if (diff !== 0) {
      await db.createMovimentacao({
        produto_id: id,
        tipo: diff > 0 ? 'entrada' : 'saida',
        quantidade: Math.abs(diff),
        motivo: 'Ajuste via edição de produto',
        user_id: req.user.id
      });
    }
    res.json({ mensagem: 'Produto actualizado.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao actualizar produto.' });
  }
});

router.delete('/produtos/:id', auth, adminOnly, async (req, res) => {
  try {
    await db.deleteProduto(req.params.id);
    res.json({ mensagem: 'Produto eliminado.' });
  } catch { res.status(500).json({ erro: 'Erro ao eliminar produto.' }); }
});

module.exports = router;*/

/**
 * INVENTÁRIO: Produtos, Categorias, Fornecedores
 *
 * GET  → qualquer utilizador autenticado (Administrador + Utilizador)
 * POST/PUT/DELETE → apenas Administrador
 */
const router = require('express').Router();
const db = require('../db');
const { auth, adminOnly } = require('../middleware/auth');

// ─── CATEGORIAS ──────────────────────────────────────────────
router.get('/categorias', auth, async (req, res) => {
  try { res.json(await db.getCategorias()); }
  catch { res.status(500).json({ erro: 'Erro ao listar categorias.' }); }
});
router.post('/categorias', auth, adminOnly, async (req, res) => {
  try {
    if (!req.body.nome?.trim()) return res.status(400).json({ erro: 'Nome é obrigatório.' });
    await db.createCategoria(req.body);
    res.status(201).json({ mensagem: 'Categoria criada.' });
  } catch { res.status(500).json({ erro: 'Erro ao criar categoria.' }); }
});
router.put('/categorias/:id', auth, adminOnly, async (req, res) => {
  try {
    await db.updateCategoria(req.params.id, req.body);
    res.json({ mensagem: 'Categoria actualizada.' });
  } catch { res.status(500).json({ erro: 'Erro ao actualizar categoria.' }); }
});
router.delete('/categorias/:id', auth, adminOnly, async (req, res) => {
  try {
    await db.deleteCategoria(req.params.id);
    res.json({ mensagem: 'Categoria eliminada.' });
  } catch { res.status(500).json({ erro: 'Erro ao eliminar categoria.' }); }
});

// ─── FORNECEDORES ────────────────────────────────────────────
router.get('/fornecedores', auth, async (req, res) => {
  try { res.json(await db.getFornecedores()); }
  catch { res.status(500).json({ erro: 'Erro ao listar fornecedores.' }); }
});
router.post('/fornecedores', auth, adminOnly, async (req, res) => {
  try {
    if (!req.body.nome?.trim()) return res.status(400).json({ erro: 'Nome é obrigatório.' });
    await db.createFornecedor(req.body);
    res.status(201).json({ mensagem: 'Fornecedor criado.' });
  } catch { res.status(500).json({ erro: 'Erro ao criar fornecedor.' }); }
});
router.put('/fornecedores/:id', auth, adminOnly, async (req, res) => {
  try {
    await db.updateFornecedor(req.params.id, req.body);
    res.json({ mensagem: 'Fornecedor actualizado.' });
  } catch { res.status(500).json({ erro: 'Erro ao actualizar fornecedor.' }); }
});
router.delete('/fornecedores/:id', auth, adminOnly, async (req, res) => {
  try {
    await db.deleteFornecedor(req.params.id);
    res.json({ mensagem: 'Fornecedor eliminado.' });
  } catch { res.status(500).json({ erro: 'Erro ao eliminar fornecedor.' }); }
});

// ─── PRODUTOS ────────────────────────────────────────────────
router.get('/produtos', auth, async (req, res) => {
  try { res.json(await db.getProdutos()); }
  catch { res.status(500).json({ erro: 'Erro ao listar produtos.' }); }
});

router.get('/produtos/estoque-baixo', auth, async (req, res) => {
  try { res.json(await db.getProdutosEstoqueBaixo()); }
  catch { res.status(500).json({ erro: 'Erro ao verificar estoque.' }); }
});

router.post('/produtos', auth, adminOnly, async (req, res) => {
  try {
    const { nome, preco, quantidade } = req.body;
    if (!nome?.trim() || preco == null || quantidade == null)
      return res.status(400).json({ erro: 'Nome, preço e quantidade são obrigatórios.' });

    const result = await db.createProduto(req.body);
    // Registo automático de entrada
    await db.createMovimentacao({
      produto_id: result.insertId,
      tipo: 'entrada',
      quantidade: Number(req.body.quantidade),
      motivo: 'Cadastro inicial do produto',
      user_id: req.user.id
    });
    res.status(201).json({ mensagem: 'Produto criado.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao criar produto.' });
  }
});

router.put('/produtos/:id', auth, adminOnly, async (req, res) => {
  try {
    const id = req.params.id;
    const antes = await db.getProdutoById(id);
    if (!antes) return res.status(404).json({ erro: 'Produto não encontrado.' });

    await db.updateProduto(id, req.body);

    const diff = Number(req.body.quantidade) - Number(antes.quantidade);
    if (diff !== 0) {
      await db.createMovimentacao({
        produto_id: id,
        tipo: diff > 0 ? 'entrada' : 'saida',
        quantidade: Math.abs(diff),
        motivo: 'Ajuste via edição de produto',
        user_id: req.user.id
      });
    }
    res.json({ mensagem: 'Produto actualizado.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao actualizar produto.' });
  }
});

router.delete('/produtos/:id', auth, adminOnly, async (req, res) => {
  try {
    await db.deleteProduto(req.params.id);
    res.json({ mensagem: 'Produto eliminado.' });
  } catch { res.status(500).json({ erro: 'Erro ao eliminar produto.' }); }
});

module.exports = router;
