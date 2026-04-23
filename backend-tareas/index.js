require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();

// Validación de variables de entorno críticas
if (!process.env.JWT_SECRET) {
    console.error('❌ ERROR CRÍTICO: Falta la variable de entorno: JWT_SECRET');
    console.error('Por favor, configúrala en tu archivo .env o en el entorno de despliegue.');
    process.exit(1);
}

const hasDbUrl = process.env.MYSQL_URL || process.env.DATABASE_URL;
if (!hasDbUrl) {
    const requiredDbVars = ['DB_HOST', 'DB_USER', 'DB_NAME'];
    const missingDbVars = requiredDbVars.filter(envVar => !process.env[envVar]);
    
    if (missingDbVars.length > 0) {
        console.error(`❌ ERROR CRÍTICO: Faltan variables de base de datos: ${missingDbVars.join(', ')}`);
        console.error('Configura las variables individuales o provee MYSQL_URL / DATABASE_URL.');
        process.exit(1);
    }
}

const JWT_SECRET = process.env.JWT_SECRET;

// Asegurarse de que el directorio uploads exista
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configuración de Multer para subida de imágenes
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, 'uploads'));
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'avatar-' + uniqueSuffix + ext);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB máximo
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (extname && mimetype) {
            cb(null, true);
        } else {
            cb(new Error('Solo se permiten imágenes (jpg, png, gif, webp)'));
        }
    }
});

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Servir archivos subidos como estáticos
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// CONFIGURACIÓN DE LA CONEXIÓN
const {
    MYSQL_URL, DATABASE_URL,
    MYSQLHOST, MYSQL_HOST, DB_HOST,
    MYSQLUSER, MYSQL_USER, DB_USER,
    MYSQLPASSWORD, MYSQL_PASSWORD, DB_PASSWORD,
    MYSQLDATABASE, MYSQL_DATABASE, DB_NAME,
    MYSQLPORT, MYSQL_PORT, DB_PORT
} = process.env;

console.log("=== DEBUG RAILWAY ===");
console.log("Variables detectadas:", Object.keys(process.env).join(', '));
if (MYSQL_URL || DATABASE_URL) console.log("=> ¡URL de base de datos encontrada!");
else console.log("=> Usando configuración de host individual.");

const dbUrl = MYSQL_URL || DATABASE_URL;

const dbConfig = {
    host:     MYSQLHOST     || MYSQL_HOST     || DB_HOST,
    user:     MYSQLUSER     || MYSQL_USER     || DB_USER,
    password: MYSQLPASSWORD || MYSQL_PASSWORD || DB_PASSWORD || '',
    database: MYSQLDATABASE || MYSQL_DATABASE || DB_NAME,
    port:     MYSQLPORT     || MYSQL_PORT     || DB_PORT     || 3306,
    ssl: (MYSQLHOST || MYSQL_URL || DATABASE_URL) ? { rejectUnauthorized: false } : false,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000
};

console.log("=== CONFIGURACIÓN DE CONEXIÓN ===");
console.log(`Host: ${dbConfig.host}`);
console.log(`Database: ${dbConfig.database}`);
console.log(`User: ${dbConfig.user}`);
console.log(`SSL: ${!!dbConfig.ssl}`);

// Usar el Pool de forma más robusta
let db;
if (dbUrl) {
    console.log("=> Usando URL de conexión (DATABASE_URL/MYSQL_URL)");
    db = mysql.createPool({
        uri: dbUrl,
        ssl: { rejectUnauthorized: false },
        waitForConnections: true,
        connectionLimit: 10
    });
} else {
    console.log("=> Usando configuración de host individual.");
    db = mysql.createPool(dbConfig);
}

// Verificar la conexión inicial con un reintento simple
const checkConnection = () => {
    db.getConnection((err, connection) => {
        if (err) {
            console.error('❌ Error obteniendo conexión del Pool:', err.message);
            console.log('Intentando de nuevo en 5 segundos...');
            setTimeout(checkConnection, 5000);
            return;
        }
        console.log('✅ Conexión al Pool establecida correctamente');
        connection.release();
    });
};
checkConnection();

// Inicialización de Tablas
const initDB = async () => {
    const createUsuariosTableQuery = `
      CREATE TABLE IF NOT EXISTS usuarios (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(255) NOT NULL,
        avatar VARCHAR(255)
      )
    `;

    const createTareasTableQuery = `
      CREATE TABLE IF NOT EXISTS tareas (
        id          INT AUTO_INCREMENT PRIMARY KEY,
        idUsuario   INT NOT NULL,
        titulo      VARCHAR(255) NOT NULL,
        descripcion TEXT,
        fechaLimite DATE,
        estado      ENUM('pendiente','completada') DEFAULT 'pendiente',
        FOREIGN KEY (idUsuario) REFERENCES usuarios(id) ON DELETE CASCADE
      )
    `;

    const createAdminsTableQuery = `
      CREATE TABLE IF NOT EXISTS administradores (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(100) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL
      )
    `;

    db.query(createUsuariosTableQuery, (err) => {
        if (err) console.error('❌ Error creando tabla de usuarios:', err.message);
        
        db.query(createTareasTableQuery, (err) => {
            if (err) {
                console.error('❌ Error creando tabla de tareas:', err.message);
            }
        });
    });

    db.query(createAdminsTableQuery, (err) => {
        if (err) {
            console.error('❌ Error creando tabla de administradores:', err.message);
            return;
        }

        db.query('SELECT COUNT(*) AS count FROM administradores', async (err, results) => {
            if (!err && results[0].count === 0) {
                try {
                    const hashed = await bcrypt.hash('admin123', 10);
                    db.query('INSERT INTO administradores (username, password) VALUES (?, ?)', ['admin', hashed], (err) => {
                        if (!err) console.log('🌱 Admin por defecto creado (admin/admin123)');
                        else console.error('❌ Error creando admin por defecto:', err.message);
                    });
                } catch (hashErr) {
                    console.error('❌ Error encriptando admin por defecto:', hashErr.message);
                }
            }
        });
    });
};

initDB();

// Middleware JWT
function verificarToken(req, res, next) {
    const header = req.headers['authorization'];
    if (!header || !header.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Token requerido o inválido' });
    }

    const token = header.split(' ')[1];
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).json({ error: 'Token expirado o inválido' });
        }
        req.adminId = decoded.id; // guardamos el id del admin
        next();
    });
}

// LOGIN
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    console.log("== INTENTO DE LOGIN RECIBIDO ==");
    console.log("Username recibido:", username);
    console.log("Password recibida:", password);

    db.query('SELECT * FROM administradores WHERE username = ?', [username], async (err, results) => {
        if (err) {
            console.error('❌ Error en query de login:', err.message);
            return res.status(500).json({ error: 'Error del servidor', details: err.message });
        }
        if (results.length === 0) return res.status(401).json({ error: 'Credenciales inválidas' });

        const admin = results[0];
        const coincide = await bcrypt.compare(password, admin.password);
        if (!coincide) return res.status(401).json({ error: 'Credenciales inválidas' });

        const token = jwt.sign({ id: admin.id, username: admin.username }, JWT_SECRET, { expiresIn: '8h' });
        res.json({ token, username: admin.username });
    });
});

// GET - Obtener tareas (opcionalmente filtrado por idUsuario) (PÚBLICO)
app.get('/tareas', (req, res) => {
    const { idUsuario } = req.query;
    let query = 'SELECT *, DATE_FORMAT(fechaLimite, "%Y-%m-%d") as fechaLimite FROM tareas';
    let params = [];
    if (idUsuario) {
        query += ' WHERE idUsuario = ?';
        params = [idUsuario];
    }
    db.query(query, params, (err, results) => {
        if (err) return res.status(500).send(err);
        res.json(results);
    });
});

// PUT - Editar campos de una tarea (PROTEGIDO)
app.put('/tareas/:id/editar', verificarToken, (req, res) => {
    const { id } = req.params;
    const { titulo, descripcion, fechaLimite } = req.body;
    console.log(`✏️  Editando tarea ${id}:`, { titulo, descripcion, fechaLimite });
    const query = 'UPDATE tareas SET titulo = ?, descripcion = ?, fechaLimite = ? WHERE id = ?';
    db.query(query, [titulo, descripcion || null, fechaLimite || null, id], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send(err);
        }
        res.json({ message: 'Tarea actualizada exitosamente' });
    });
});

// PUT - Completar tarea (PROTEGIDO)
app.put('/tareas/:id', verificarToken, (req, res) => {
    const { id } = req.params;
    console.log(`✔️  Completando tarea ${id}`);
    const query = 'UPDATE tareas SET estado = "completada" WHERE id = ?';
    db.query(query, [id], (err, result) => {
        if (err) {
            console.error('❌ Error al completar tarea:', err.message);
            return res.status(500).json({ error: 'Error al completar la tarea', details: err.message });
        }
        res.json({ message: 'Tarea completada' });
    });
});

// DELETE - Eliminar una tarea (PROTEGIDO)
app.delete('/tareas/:id', verificarToken, (req, res) => {
    const { id } = req.params;
    console.log(`🗑️  Borrando tarea ${id}`);
    const query = 'DELETE FROM tareas WHERE id = ?';
    db.query(query, [id], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send(err);
        }
        res.json({ message: 'Tarea eliminada exitosamente' });
    });
});

// POST - Crear una nueva tarea referenciada a un usuario (PROTEGIDO)
app.post('/tareas', verificarToken, (req, res) => {
    const { titulo, descripcion, idUsuario, fechaLimite } = req.body;
    console.log('➕ Intentando crear tarea:', { titulo, idUsuario });
    
    if (!titulo || !idUsuario) {
        return res.status(400).json({ error: 'Título e idUsuario son requeridos' });
    }

    const query = 'INSERT INTO tareas (idUsuario, titulo, descripcion, fechaLimite) VALUES (?, ?, ?, ?)';
    db.query(query, [idUsuario, titulo, descripcion || null, fechaLimite || null], (err, result) => {
        if (err) {
            console.error('❌ Error al insertar tarea:', err.message);
            return res.status(500).json({ 
                error: 'Error al guardar la tarea en la base de datos',
                details: err.message,
                sqlState: err.sqlState,
                code: err.code
            });
        }
        console.log('✅ Tarea guardada con ID:', result.insertId);
        res.json({ message: 'Tarea guardada', id: result.insertId });
    });
});

// ==========================================
// GESTIÓN DE USUARIOS
// ==========================================

// GET - Listar usuarios (PÚBLICO)
app.get('/usuarios', (req, res) => {
    db.query('SELECT * FROM usuarios', (err, results) => {
        if (err) return res.status(500).send(err);
        res.json(results);
    });
});

// POST - Crear usuario (PROTEGIDO)
app.post('/usuarios', verificarToken, upload.single('avatarFile'), (req, res) => {
    const { nombre } = req.body;
    let avatar = req.body.avatar;
    if (req.file) {
        avatar = req.file.filename;
    }
    
    if (!nombre) return res.status(400).json({ error: 'Nombre es requerido' });
    
    db.query('INSERT INTO usuarios (nombre, avatar) VALUES (?, ?)', [nombre, avatar || null], (err, result) => {
        if (err) return res.status(500).send(err);
        res.json({ message: 'Usuario creado', id: result.insertId, avatar });
    });
});

// PUT - Editar usuario (PROTEGIDO)
app.put('/usuarios/:id', verificarToken, upload.single('avatarFile'), (req, res) => {
    const { id } = req.params;
    const { nombre } = req.body;
    let avatar = req.body.avatar;
    if (req.file) {
        avatar = req.file.filename;
    }

    db.query('UPDATE usuarios SET nombre = ?, avatar = ? WHERE id = ?', [nombre, avatar || null, id], (err) => {
        if (err) return res.status(500).send(err);
        res.json({ message: 'Usuario actualizado', avatar });
    });
});

// DELETE - Borrar usuario (PROTEGIDO)
app.delete('/usuarios/:id', verificarToken, (req, res) => {
    const { id } = req.params;
    db.query('DELETE FROM usuarios WHERE id = ?', [id], (err) => {
        if (err) return res.status(500).send(err);
        res.json({ message: 'Usuario eliminado' });
    });
});

// ==========================================
// GESTIÓN DE ADMINISTRADORES
// ==========================================

// GET - Listar administradores (PROTEGIDO)
app.get('/administradores', verificarToken, (req, res) => {
    // Nunca devolver devolvemos las contraseñas al cliente
    db.query('SELECT id, username FROM administradores', (err, results) => {
        if (err) return res.status(500).send(err);
        res.json(results);
    });
});

// POST - Crear administrador (PROTEGIDO)
app.post('/administradores', verificarToken, async (req, res) => {
    const { username, password } = req.body;
    try {
        const hashed = await bcrypt.hash(password, 10);
        const query = 'INSERT INTO administradores (username, password) VALUES (?, ?)';
        db.query(query, [username, hashed], (err, result) => {
            if (err) {
                if (err.code === 'ER_DUP_ENTRY') {
                    return res.status(400).json({ error: 'El nombre de usuario ya existe' });
                }
                return res.status(500).send(err);
            }
            res.json({ message: 'Administrador creado', id: result.insertId });
        });
    } catch (e) {
        res.status(500).json({ error: 'Error encriptando contraseña' });
    }
});

// DELETE - Borrar administrador (PROTEGIDO)
app.delete('/administradores/:id', verificarToken, (req, res) => {
    const { id } = req.params;
    if (parseInt(id) === req.adminId) {
        return res.status(400).json({ error: 'No puedes borrar tu propio usuario mientras accedes' });
    }
    db.query('DELETE FROM administradores WHERE id = ?', [id], (err, result) => {
        if (err) return res.status(500).send(err);
        res.json({ message: 'Administrador eliminado' });
    });
});

// PUT - Modificar Username/Password de administrador (PROTEGIDO)
app.put('/administradores/:id', verificarToken, async (req, res) => {
    const { id } = req.params;
    const { username, password } = req.body;

    try {
        if (password) {
            // Se actualiza usuario y contraseña
            const hashed = await bcrypt.hash(password, 10);
            db.query('UPDATE administradores SET username = ?, password = ? WHERE id = ?', [username, hashed, id], (err) => {
                if (err) return res.status(500).send(err);
                res.json({ message: 'Administrador actualizado (con contraseña)' });
            });
        } else {
            // Se actualiza solo usuario
            db.query('UPDATE administradores SET username = ? WHERE id = ?', [username, id], (err) => {
                if (err) return res.status(500).send(err);
                res.json({ message: 'Administrador actualizado (sin cambiar password)' });
            });
        }
    } catch (e) {
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// Manejadores de errores globales para evitar caídas silenciosas
process.on('unhandledRejection', (reason, promise) => {
    console.error('⚠️ Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
    console.error('⚠️ Uncaught Exception thrown:', err.message);
    console.error(err.stack);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor en puerto ${PORT}`);
});
