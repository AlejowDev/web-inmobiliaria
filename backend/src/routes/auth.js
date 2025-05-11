const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');

module.exports = (prisma, jwtSecret) => {
  const router = require('express').Router();

  // Validaciones con express-validator (opcional pero recomendado)
  const { body } = require('express-validator');
  const validate = [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('fullName').notEmpty().trim()
  ];

  // Registro de usuario
  router.post('/register', validate, async (req, res) => {
    try {
      // Validar campos
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password, fullName, phone } = req.body;

      // Verificar si el usuario ya existe
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });

      if (existingUser) {
        return res.status(400).json({ error: 'Email already in use' });
      }

      // Obtener rol por defecto (USER)
      const defaultRole = await prisma.role.findUnique({
        where: { name: 'USER' }
      });

      if (!defaultRole) {
        throw new Error('Default role not configured in database');
      }

      // Crear usuario
      const newUser = await prisma.user.create({
        data: {
          email,
          password: await bcrypt.hash(password, 12),
          fullName,
          phone,
          roleId: defaultRole.id
        },
        include: {
          role: true
        }
      });

      // Generar tokens
      const token = generateAccessToken(newUser);
      const refreshToken = generateRefreshToken(newUser);

      // Guardar refresh token
      await prisma.user.update({
        where: { id: newUser.id },
        data: { refreshToken }
      });

      res.status(201).json({
        user: formatUserResponse(newUser),
        token,
        refreshToken
      });

    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ 
        error: 'Registration failed',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });

  // Login de usuario
  router.post('/login', async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      // Buscar usuario con su rol
      const user = await prisma.user.findUnique({
        where: { email },
        include: {
          role: true
        }
      });

      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Verificar contraseña
      const passwordValid = await bcrypt.compare(password, user.password);
      if (!passwordValid) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Generar tokens
      const token = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);

      // Actualizar refresh token en BD
      await prisma.user.update({
        where: { id: user.id },
        data: { refreshToken }
      });

      res.json({
        user: formatUserResponse(user),
        token,
        refreshToken
      });

    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ 
        error: 'Login failed',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });

  // Refresh token
  router.post('/refresh-token', async (req, res) => {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({ error: 'Refresh token is required' });
      }

      // Verificar token
      const decoded = jwt.verify(refreshToken, jwtSecret);
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        include: {
          role: true
        }
      });

      if (!user || user.refreshToken !== refreshToken) {
        return res.status(401).json({ error: 'Invalid refresh token' });
      }

      // Generar nuevo access token
      const newToken = generateAccessToken(user);

      res.json({ 
        token: newToken,
        user: formatUserResponse(user)
      });

    } catch (error) {
      console.error('Refresh token error:', error);
      res.status(401).json({ 
        error: 'Invalid refresh token',
        details: jwt.TokenExpiredError ? 'Token expired' : undefined
      });
    }
  });

  // Perfil de usuario
  router.get('/profile', async (req, res) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.auth.userId },
        include: {
          role: true
        }
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json(formatUserResponse(user));
    } catch (error) {
      console.error('Profile error:', error);
      res.status(500).json({ error: 'Failed to fetch profile' });
    }
  });

  // Actualizar perfil
  router.put('/profile', async (req, res) => {
    try {
      const { fullName, phone } = req.body;

      const updatedUser = await prisma.user.update({
        where: { id: req.auth.userId },
        data: {
          fullName,
          phone
        },
        include: {
          role: true
        }
      });

      res.json(formatUserResponse(updatedUser));
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({ error: 'Failed to update profile' });
    }
  });

  // Logout
  router.post('/logout', async (req, res) => {
    try {
      await prisma.user.update({
        where: { id: req.auth.userId },
        data: { refreshToken: null }
      });

      res.json({ message: 'Logged out successfully' });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({ error: 'Logout failed' });
    }
  });

  // Funciones auxiliares
  function generateAccessToken(user) {
    return jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role.name
      },
      jwtSecret,
      { expiresIn: '1h' }
    );
  }

  function generateRefreshToken(user) {
    return jwt.sign(
      { userId: user.id },
      jwtSecret,
      { expiresIn: '7d' }
    );
  }

  function formatUserResponse(user) {
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
      role: user.role.name,
      createdAt: user.createdAt
    };
  }

  return router;
};