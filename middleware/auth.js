/*const jwt = require('jsonwebtoken');

//require('dotenv').config();

const ACCESS_SECRET = process.env.ACCESS_SECRET;
const REFRESH_SECRET = process.env.REFRESH_SECRET;
/**
 * Verifica e decodifica o JWT no header Authorization.
 * Popula req.user com { id, nivel, nome }.
 *//*
function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header)
    return res.status(401).json({ erro: 'Token não fornecido.' });

  const parts = header.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer')
    return res.status(401).json({ erro: 'Formato inválido. Use: Bearer <token>' });

  try {
    req.user = jwt.verify(parts[1], ACCESS_SECRET);
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError')
      return res.status(401).json({ erro: 'Token expirado.', code: 'TOKEN_EXPIRED' });
    return res.status(401).json({ erro: 'Token inválido.' });
  }
}

/**
 * Autoriza apenas os níveis especificados.
 * Níveis válidos: "Administrador" | "Utilizador"
 *//*
function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.nivel))
      return res.status(403).json({ erro: 'Acesso negado. Permissão insuficiente para esta acção.' });
    next();
  };
}

// Atalhos semânticos
const adminOnly    = authorize('Administrador');
const anyAuth      = authorize('Administrador', 'Utilizador');

module.exports = { auth, authorize, adminOnly, anyAuth };*/

const jwt = require('jsonwebtoken');
const ACCESS_SECRET = process.env.ACCESS_SECRET;
const REFRESH_SECRET = process.env.REFRESH_SECRET;
//const { ACCESS_SECRET } = require('../config');

/**
 * Verifica e decodifica o JWT no header Authorization.
 * Popula req.user com { id, nivel, nome }.
 */
function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header)
    return res.status(401).json({ erro: 'Token não fornecido.' });

  const parts = header.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer')
    return res.status(401).json({ erro: 'Formato inválido. Use: Bearer <token>' });

  try {
    req.user = jwt.verify(parts[1], ACCESS_SECRET);
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError')
      return res.status(401).json({ erro: 'Token expirado.', code: 'TOKEN_EXPIRED' });
    return res.status(401).json({ erro: 'Token inválido.' });
  }
}

/**
 * Autoriza apenas os níveis especificados.
 * Níveis válidos: "Administrador" | "Utilizador"
 */
function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.nivel))
      return res.status(403).json({ erro: 'Acesso negado. Permissão insuficiente para esta acção.' });
    next();
  };
}

// Atalhos semânticos
const adminOnly    = authorize('Administrador');
const anyAuth      = authorize('Administrador', 'Utilizador');

module.exports = { auth, authorize, adminOnly, anyAuth };