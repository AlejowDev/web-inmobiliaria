require('dotenv').config();
const express = require('express');
const { PrismaClient } = require('../generated/prisma');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { expressjwt: jwtMiddleware } = require('express-jwt');

const prisma = new PrismaClient();
const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Configuración JWT
const jwtSecret = process.env.JWT_SECRET || 'your-strong-secret-key-here';
const jwtConfig = {
  secret: jwtSecret,
  algorithms: ['HS256'],
  requestProperty: 'auth', // Esto permite acceder a los datos del token via req.auth
  getToken: (req) => {
    if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
      return req.headers.authorization.split(' ')[1];
    }
    return null;
  }
};

// Middleware de autenticación JWT (excluye rutas públicas)
app.use(
  jwtMiddleware(jwtConfig).unless({
    path: [
      '/api/health',
      '/api/auth/login',
      '/api/auth/register',
      '/api/auth/refresh-token',
      // Agrega aquí otras rutas públicas si es necesario
    ]
  })
);

// Importar rutas
const authRoutes = require('./routes/auth')(prisma, jwtSecret); // Nueva ruta de autenticación
const countriesRoutes = require('./routes/countries');
const statesRoutes = require('./routes/states');
const citiesRoutes = require('./routes/cities');
const projectsRoutes = require('./routes/projects');

// Usar rutas
app.use('/api/auth', authRoutes); // Agregar esta línea antes de las otras rutas
app.use('/api/countries', countriesRoutes(prisma));
app.use('/api/states', statesRoutes(prisma));
app.use('/api/cities', citiesRoutes(prisma));
app.use('/api/projects', projectsRoutes(prisma));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

// Manejo de errores centralizado (mejorado para errores JWT)
app.use((err, req, res, next) => {
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ 
      error: 'Invalid or expired token',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
  
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  // Opcional: Crear roles iniciales si no existen
  initializeRoles();
});

// Función para inicializar roles (opcional)
async function initializeRoles() {
  try {
    const roles = ['USER', 'ADMIN', 'AGENT'];
    for (const roleName of roles) {
      await prisma.role.upsert({
        where: { name: roleName },
        update: {},
        create: { name: roleName }
      });
    }
    console.log('Roles inicializados correctamente');
  } catch (error) {
    console.error('Error inicializando roles:', error);
  }
}

// Manejo de cierre graceful
process.on('SIGTERM', () => {
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
});