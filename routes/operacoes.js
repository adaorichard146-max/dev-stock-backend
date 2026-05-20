/**
 * OPERAÇÕES: Vendas, Movimentações, Relatórios
 *
 * Movimentações GET  → todos autenticados
 * Movimentações POST → apenas Administrador (ajuste manual)
 * Vendas POST        → todos autenticados (Utilizador pode vender)
 * Vendas GET         → todos autenticados
 * Relatórios         → apenas Administrador
 *//*
const router = require('express').Router();
const db = require('../db');
const { auth, adminOnly } = require('../middleware/auth');

// ─── MOVIMENTAÇÕES ───────────────────────────────────────────
router.get('/movimentacoes', auth, async (req, res) => {
  try {
    const { inicio, fim, produto_id } = req.query;
    res.json(await db.getMovimentacoes(inicio, fim, produto_id));
  } catch { res.status(500).json({ erro: 'Erro ao listar movimentações.' }); }
});

// Ajuste manual de stock — apenas Administrador
router.post('/movimentacoes', auth, adminOnly, async (req, res) => {
  try {
    const { produto_id, tipo, quantidade, motivo } = req.body;
    if (!produto_id || !tipo || !quantidade)
      return res.status(400).json({ erro: 'produto_id, tipo e quantidade são obrigatórios.' });
    if (!['entrada', 'saida'].includes(tipo))
      return res.status(400).json({ erro: 'Tipo inválido. Use: entrada | saida.' });

    const produto = await db.getProdutoById(produto_id);
    if (!produto) return res.status(404).json({ erro: 'Produto não encontrado.' });

    if (tipo === 'saida' && produto.quantidade < quantidade)
      return res.status(400).json({ erro: `Stock insuficiente. Disponível: ${produto.quantidade} un.` });

    const delta = tipo === 'entrada' ? Number(quantidade) : -Number(quantidade);
    await db.updateProdutoQuantidade(produto_id, delta);
    await db.createMovimentacao({ produto_id, tipo, quantidade, motivo, user_id: req.user.id });

    res.status(201).json({ mensagem: 'Movimentação registada com sucesso.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao registar movimentação.' });
  }
});

// ─── VENDAS ──────────────────────────────────────────────────
router.get('/vendas', auth, async (req, res) => {
  try {
    const { inicio, fim } = req.query;
    res.json(await db.getVendas(inicio, fim));
  } catch { res.status(500).json({ erro: 'Erro ao listar vendas.' }); }
});

// Criar venda — Administrador e Utilizador
router.post('/vendas', auth, async (req, res) => {
  try {
    const { itens } = req.body;
    if (!Array.isArray(itens) || itens.length === 0)
      return res.status(400).json({ erro: 'Lista de itens é obrigatória e não pode estar vazia.' });

    // Validar stock antes de processar tudo
    for (const item of itens) {
      if (!item.produto_id || !item.quantidade || item.quantidade < 1)
        return res.status(400).json({ erro: 'Cada item precisa de produto_id e quantidade válida.' });
      const p = await db.getProdutoById(item.produto_id);
      if (!p) return res.status(404).json({ erro: `Produto ID ${item.produto_id} não encontrado.` });
      if (p.quantidade < item.quantidade)
        return res.status(400).json({
          erro: `Stock insuficiente para "${p.nome}". Disponível: ${p.quantidade} un., solicitado: ${item.quantidade} un.`
        });
    }

    // Calcular total
    let total = 0;
    const itensCompletos = [];
    for (const item of itens) {
      const p = await db.getProdutoById(item.produto_id);
      const preco = item.preco_unitario ?? p.preco;
      total += preco * item.quantidade;
      itensCompletos.push({ produto_id: item.produto_id, quantidade: item.quantidade, preco_unitario: preco, nome: p.nome });
    }

    // Criar venda
    const result = await db.createVenda({ user_id: req.user.id, total });
    const venda_id = result.insertId;

    // Processar itens
    for (const item of itensCompletos) {
      await db.createItemVenda({ venda_id, ...item });
      await db.updateProdutoQuantidade(item.produto_id, -item.quantidade);
      await db.createMovimentacao({
        produto_id: item.produto_id,
        tipo: 'saida',
        quantidade: item.quantidade,
        motivo: `Venda #${venda_id}`,
        user_id: req.user.id
      });
    }

    res.status(201).json({ mensagem: 'Venda finalizada com sucesso.', venda_id, total });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao processar venda.' });
  }
});

// ─── RELATÓRIOS — apenas Administrador ───────────────────────
router.get('/relatorio/financeiro', auth, adminOnly, async (req, res) => {
  try {
    const { inicio, fim } = req.query;
    const [resumo, porDia, topProdutos] = await Promise.all([
      db.resumoFinanceiro(inicio, fim),
      db.relatorioFinanceiroPorDia(inicio, fim),
      db.produtosMaisVendidos(inicio, fim)
    ]);
    res.json({ resumo: resumo[0], porDia, topProdutos });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao gerar relatório financeiro.' });
  }
});

router.get('/relatorio/estoque', auth, adminOnly, async (req, res) => {
  try {
    const [todos, baixo] = await Promise.all([
      db.estoqueAtual(),
      db.getProdutosEstoqueBaixo()
    ]);
    const valorTotal = todos.reduce((s, p) => s + Number(p.valor_total), 0);
    const totalUnidades = todos.reduce((s, p) => s + Number(p.quantidade), 0);
    res.json({ produtos: todos, baixo, valorTotal, totalUnidades });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao gerar relatório de estoque.' });
  }
});

module.exports = router;
*/

/**
 * OPERAÇÕES: Vendas, Movimentações, Relatórios
 *
 * Movimentações GET  → todos autenticados
 * Movimentações POST → apenas Administrador (ajuste manual)
 * Vendas POST        → todos autenticados (Utilizador pode vender)
 * Vendas GET         → todos autenticados
 * Relatórios         → apenas Administrador
 */
const router = require('express').Router();
const db = require('../db');
const { auth, adminOnly } = require('../middleware/auth');

// ─── MOVIMENTAÇÕES ───────────────────────────────────────────
router.get('/movimentacoes', auth, async (req, res) => {
  try {
    const { inicio, fim, produto_id } = req.query;
    res.json(await db.getMovimentacoes(inicio, fim, produto_id));
  } catch { res.status(500).json({ erro: 'Erro ao listar movimentações.' }); }
});

// Ajuste manual de stock — apenas Administrador
router.post('/movimentacoes', auth, adminOnly, async (req, res) => {
  try {
    const { produto_id, tipo, quantidade, motivo } = req.body;
    if (!produto_id || !tipo || !quantidade)
      return res.status(400).json({ erro: 'produto_id, tipo e quantidade são obrigatórios.' });
    if (!['entrada', 'saida'].includes(tipo))
      return res.status(400).json({ erro: 'Tipo inválido. Use: entrada | saida.' });

    const produto = await db.getProdutoById(produto_id);
    if (!produto) return res.status(404).json({ erro: 'Produto não encontrado.' });

    if (tipo === 'saida' && produto.quantidade < quantidade)
      return res.status(400).json({ erro: `Stock insuficiente. Disponível: ${produto.quantidade} un.` });

    const delta = tipo === 'entrada' ? Number(quantidade) : -Number(quantidade);
    await db.updateProdutoQuantidade(produto_id, delta);
    await db.createMovimentacao({ produto_id, tipo, quantidade, motivo, user_id: req.user.id });

    res.status(201).json({ mensagem: 'Movimentação registada com sucesso.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao registar movimentação.' });
  }
});

// ─── VENDAS ──────────────────────────────────────────────────
router.get('/vendas', auth, async (req, res) => {
  try {
    const { inicio, fim } = req.query;
    res.json(await db.getVendas(inicio, fim));
  } catch { res.status(500).json({ erro: 'Erro ao listar vendas.' }); }
});

// Criar venda — Administrador e Utilizador
router.post('/vendas', auth, async (req, res) => {
  try {
    const { itens } = req.body;
    if (!Array.isArray(itens) || itens.length === 0)
      return res.status(400).json({ erro: 'Lista de itens é obrigatória e não pode estar vazia.' });

    // Validar stock antes de processar tudo
    for (const item of itens) {
      if (!item.produto_id || !item.quantidade || item.quantidade < 1)
        return res.status(400).json({ erro: 'Cada item precisa de produto_id e quantidade válida.' });
      const p = await db.getProdutoById(item.produto_id);
      if (!p) return res.status(404).json({ erro: `Produto ID ${item.produto_id} não encontrado.` });
      if (p.quantidade < item.quantidade)
        return res.status(400).json({
          erro: `Stock insuficiente para "${p.nome}". Disponível: ${p.quantidade} un., solicitado: ${item.quantidade} un.`
        });
    }

    // Calcular total
    let total = 0;
    const itensCompletos = [];
    for (const item of itens) {
      const p = await db.getProdutoById(item.produto_id);
      const preco = item.preco_unitario ?? p.preco;
      total += preco * item.quantidade;
      itensCompletos.push({ produto_id: item.produto_id, quantidade: item.quantidade, preco_unitario: preco, nome: p.nome });
    }

    // Criar venda
    const result = await db.createVenda({ user_id: req.user.id, total });
    const venda_id = result.insertId;

    // Processar itens
    for (const item of itensCompletos) {
      await db.createItemVenda({ venda_id, ...item });
      await db.updateProdutoQuantidade(item.produto_id, -item.quantidade);
      await db.createMovimentacao({
        produto_id: item.produto_id,
        tipo: 'saida',
        quantidade: item.quantidade,
        motivo: `Venda #${venda_id}`,
        user_id: req.user.id
      });
    }

    res.status(201).json({ mensagem: 'Venda finalizada com sucesso.', venda_id, total });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao processar venda.' });
  }
});

// ─── RELATÓRIOS — apenas Administrador ───────────────────────
router.get('/relatorio/financeiro', auth, adminOnly, async (req, res) => {
  try {
    const { inicio, fim } = req.query;
    const [resumo, porDia, topProdutos] = await Promise.all([
      db.resumoFinanceiro(inicio, fim),
      db.relatorioFinanceiroPorDia(inicio, fim),
      db.produtosMaisVendidos(inicio, fim)
    ]);
    res.json({ resumo: resumo[0], porDia, topProdutos });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao gerar relatório financeiro.' });
  }
});

router.get('/relatorio/estoque', auth, adminOnly, async (req, res) => {
  try {
    const [todos, baixo] = await Promise.all([
      db.estoqueAtual(),
      db.getProdutosEstoqueBaixo()
    ]);
    const valorTotal = todos.reduce((s, p) => s + Number(p.valor_total), 0);
    const totalUnidades = todos.reduce((s, p) => s + Number(p.quantidade), 0);
    res.json({ produtos: todos, baixo, valorTotal, totalUnidades });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao gerar relatório de estoque.' });
  }
});

module.exports = router;
