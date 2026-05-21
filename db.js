const mysql = require('mysql2');

const mysql = require('mysql2');

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

const promisePool = pool.promise();

async function query(sql, params = []) {
  const [rows] = await promisePool.execute(sql, params);
  return rows;
}
// ─── USERS ───────────────────────────────────────────────────
const getUsers = () => query(
  "SELECT id,nome,email,nivel,estado,avatar,criadoem FROM users ORDER BY nome"
);
const getUserByEmail = async (email) =>
  (await query("SELECT * FROM users WHERE email=?", [email]))[0];
const getUserById = async (id) =>
  (await query("SELECT id,nome,email,nivel,estado,avatar FROM users WHERE id=?", [id]))[0];

const createUser = (u) => query(
  "INSERT INTO users(nome,email,senha,nivel,estado,avatar,criadoem) VALUES(?,?,?,?,?,?,NOW())",
  [u.nome, u.email, u.senha, u.nivel, u.estado ?? 'Activo', u.avatar ?? null]
);
const updateUser = (id, u) => query(
  "UPDATE users SET nome=?,email=?,nivel=?,estado=? WHERE id=?",
  [u.nome, u.email, u.nivel, u.estado, id]
);
const updateUserPassword = (id, senha) =>
  query("UPDATE users SET senha=? WHERE id=?", [senha, id]);
const updateUserState = (id, estado) =>
  query("UPDATE users SET estado=? WHERE id=?", [estado, id]);
const updateUserAvatar = (id, avatar) =>
  query("UPDATE users SET avatar=? WHERE id=?", [avatar, id]);
const updateUserProfile = (id, u) =>
  query("UPDATE users SET nome=?,email=? WHERE id=?", [u.nome, u.email, id]);
const deleteUser = (id) => query("DELETE FROM users WHERE id=?", [id]);

// ─── REFRESH TOKENS ──────────────────────────────────────────
const saveRefreshToken = (user_id, token) => query(
  "INSERT INTO refresh_tokens(user_id,token,criadoem) VALUES(?,?,NOW())", [user_id, token]
);
const findRefreshToken = async (token) =>
  (await query("SELECT * FROM refresh_tokens WHERE token=?", [token]))[0];
const deleteRefreshToken  = (token) =>
  query("DELETE FROM refresh_tokens WHERE token=?", [token]);
const deleteAllUserTokens = (user_id) =>
  query("DELETE FROM refresh_tokens WHERE user_id=?", [user_id]);

// ─── CATEGORIA ───────────────────────────────────────────────
const getCategorias   = () => query("SELECT * FROM categoria ORDER BY nome");
const createCategoria = (c) => query("INSERT INTO categoria(nome) VALUES(?)", [c.nome]);
const updateCategoria = (id, c) => query("UPDATE categoria SET nome=? WHERE id=?", [c.nome, id]);
const deleteCategoria = (id) => query("DELETE FROM categoria WHERE id=?", [id]);

// ─── FORNECEDOR ──────────────────────────────────────────────
const getFornecedores   = () => query("SELECT * FROM fornecedor ORDER BY nome");
const createFornecedor  = (f) => query(
  "INSERT INTO fornecedor(nome,telefone,email) VALUES(?,?,?)",
  [f.nome, f.telefone ?? null, f.email ?? null]
);
const updateFornecedor = (id, f) => query(
  "UPDATE fornecedor SET nome=?,telefone=?,email=? WHERE id=?",
  [f.nome, f.telefone ?? null, f.email ?? null, id]
);
const deleteFornecedor = (id) => query("DELETE FROM fornecedor WHERE id=?", [id]);

// ─── PRODUTO ─────────────────────────────────────────────────
const getProdutos = () => query(`
  SELECT p.id,p.nome,p.preco,p.quantidade,p.quantidade_minima,p.criadoem,
         c.nome AS categoria, c.id AS categoria_id,
         f.nome AS fornecedor, f.id AS fornecedor_id
  FROM produto p
  LEFT JOIN categoria c ON p.categoria_id=c.id
  LEFT JOIN fornecedor f ON p.fornecedor_id=f.id
  ORDER BY p.nome
`);
const getProdutoById = async (id) =>
  (await query("SELECT * FROM produto WHERE id=?", [id]))[0];
const createProduto = (p) => query(
  "INSERT INTO produto(nome,preco,quantidade,quantidade_minima,categoria_id,fornecedor_id,criadoem) VALUES(?,?,?,?,?,?,NOW())",
  [p.nome, p.preco, p.quantidade, p.quantidade_minima ?? 5, p.categoria_id ?? null, p.fornecedor_id ?? null]
);
const updateProduto = (id, p) => query(
  "UPDATE produto SET nome=?,preco=?,quantidade=?,quantidade_minima=?,categoria_id=?,fornecedor_id=? WHERE id=?",
  [p.nome, p.preco, p.quantidade, p.quantidade_minima ?? 5, p.categoria_id ?? null, p.fornecedor_id ?? null, id]
);
const deleteProduto          = (id) => query("DELETE FROM produto WHERE id=?", [id]);
const updateProdutoQuantidade = (id, delta) =>
  query("UPDATE produto SET quantidade=quantidade+? WHERE id=?", [delta, id]);
const getProdutosEstoqueBaixo = () => query(
  "SELECT p.*,c.nome AS categoria FROM produto p LEFT JOIN categoria c ON p.categoria_id=c.id WHERE p.quantidade<=p.quantidade_minima ORDER BY p.quantidade"
);

// ─── MOVIMENTAÇÃO ────────────────────────────────────────────
const createMovimentacao = (m) => query(
  "INSERT INTO movimentacao(produto_id,tipo,quantidade,motivo,user_id,data) VALUES(?,?,?,?,?,NOW())",
  [m.produto_id, m.tipo, m.quantidade, m.motivo ?? null, m.user_id ?? null]
);
const getMovimentacoes = (dataInicio, dataFim, produto_id) => {
  let sql = `
    SELECT m.id,m.tipo,m.quantidade,m.motivo,m.data,
           p.nome AS produto, c.nome AS categoria,
           u.nome AS usuario
    FROM movimentacao m
    LEFT JOIN produto p ON m.produto_id=p.id
    LEFT JOIN categoria c ON p.categoria_id=c.id
    LEFT JOIN users u ON m.user_id=u.id
    WHERE 1=1
  `;
  const params = [];
  if (dataInicio && dataFim) { sql += " AND DATE(m.data) BETWEEN ? AND ?"; params.push(dataInicio, dataFim); }
  if (produto_id)            { sql += " AND m.produto_id=?";               params.push(produto_id); }
  sql += " ORDER BY m.data DESC LIMIT 500";
  return query(sql, params);
};

// ─── VENDAS ──────────────────────────────────────────────────
const createVenda   = (v) => query(
  "INSERT INTO venda(user_id,total,data_venda) VALUES(?,?,NOW())", [v.user_id, v.total]
);
const getVendas = (dataInicio, dataFim) => {
  let sql = `
    SELECT v.id,v.total,v.data_venda, u.nome AS vendedor
    FROM venda v LEFT JOIN users u ON v.user_id=u.id WHERE 1=1
  `;
  const params = [];
  if (dataInicio && dataFim) { sql += " AND DATE(v.data_venda) BETWEEN ? AND ?"; params.push(dataInicio, dataFim); }
  sql += " ORDER BY v.data_venda DESC";
  return query(sql, params);
};
const createItemVenda = (i) => query(
  "INSERT INTO itemvenda(venda_id,produto_id,quantidade,preco_unitario) VALUES(?,?,?,?)",
  [i.venda_id, i.produto_id, i.quantidade, i.preco_unitario]
);
const getItensVenda = (venda_id) => query(
  "SELECT i.*,p.nome AS produto FROM itemvenda i LEFT JOIN produto p ON i.produto_id=p.id WHERE i.venda_id=?",
  [venda_id]
);

// ─── RELATÓRIOS ──────────────────────────────────────────────
const resumoFinanceiro = (dataInicio, dataFim) => {
  let sql = "SELECT COUNT(*) AS total_vendas, COALESCE(SUM(total),0) AS faturamento, COALESCE(AVG(total),0) AS ticket_medio, COALESCE(MAX(total),0) AS maior_venda FROM venda WHERE 1=1";
  const params = [];
  if (dataInicio && dataFim) { sql += " AND DATE(data_venda) BETWEEN ? AND ?"; params.push(dataInicio, dataFim); }
  return query(sql, params);
};
const relatorioFinanceiroPorDia = (dataInicio, dataFim) => {
  let sql = `
    SELECT DATE(data_venda) AS dia, COUNT(*) AS total_vendas,
           SUM(total) AS faturamento, AVG(total) AS ticket_medio, MAX(total) AS maior_venda
    FROM venda WHERE 1=1
  `;
  const params = [];
  if (dataInicio && dataFim) { sql += " AND DATE(data_venda) BETWEEN ? AND ?"; params.push(dataInicio, dataFim); }
  sql += " GROUP BY DATE(data_venda) ORDER BY dia DESC";
  return query(sql, params);
};
const produtosMaisVendidos = (dataInicio, dataFim) => {
  let sql = `
    SELECT p.nome, SUM(i.quantidade) AS total_vendido,
           SUM(i.quantidade*i.preco_unitario) AS receita
    FROM itemvenda i JOIN produto p ON i.produto_id=p.id
    JOIN venda v ON i.venda_id=v.id WHERE 1=1
  `;
  const params = [];
  if (dataInicio && dataFim) { sql += " AND DATE(v.data_venda) BETWEEN ? AND ?"; params.push(dataInicio, dataFim); }
  sql += " GROUP BY p.id,p.nome ORDER BY total_vendido DESC LIMIT 15";
  return query(sql, params);
};
const estoqueAtual = () => query(`
  SELECT p.id,p.nome,p.preco,p.quantidade,p.quantidade_minima,
         c.nome AS categoria, f.nome AS fornecedor,
         (p.preco*p.quantidade) AS valor_total
  FROM produto p
  LEFT JOIN categoria c ON p.categoria_id=c.id
  LEFT JOIN fornecedor f ON p.fornecedor_id=f.id
  ORDER BY p.nome
`);

module.exports = {
  query,
  getUsers, getUserByEmail, getUserById,
  createUser, updateUser, updateUserPassword, updateUserState,
  updateUserAvatar, updateUserProfile, deleteUser,
  saveRefreshToken, findRefreshToken, deleteRefreshToken, deleteAllUserTokens,
  getCategorias, createCategoria, updateCategoria, deleteCategoria,
  getFornecedores, createFornecedor, updateFornecedor, deleteFornecedor,
  getProdutos, getProdutoById, createProduto, updateProduto, deleteProduto,
  updateProdutoQuantidade, getProdutosEstoqueBaixo,
  createMovimentacao, getMovimentacoes,
  createVenda, getVendas, createItemVenda, getItensVenda,
  resumoFinanceiro, relatorioFinanceiroPorDia, produtosMaisVendidos, estoqueAtual
};
