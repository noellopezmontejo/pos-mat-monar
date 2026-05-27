require('dotenv').config()
const jwt = require('jsonwebtoken')

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (token == null) {
    console.log('[Auth] No se proporcionó token');
    return res.sendStatus(401);
  }

  const secret = process.env.JWT_SECRET;
  
  if (!secret) {
    console.error('[Auth] ERROR: JWT_SECRET no está definido en el entorno');
    return res.status(500).json({ error: 'Configuración de seguridad incompleta' });
  }

  jwt.verify(token, secret, { ignoreExpiration: true }, (err, user) => {
    if (err) {
      console.log('[Auth] Error de verificación de JWT:', err.message);
      console.log('[Auth] Token recibido (abreviado):', token.substring(0, 10) + '...');
      return res.status(403).json({ 
        error: 'Sesión inválida o expirada', 

        details: err.message 
      });
    }
    req.user = user
    next()
  })
}

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'No tienes permiso para realizar esta acción' })
    }
    next()
  }
}

module.exports = { authenticateToken, authorizeRoles }
