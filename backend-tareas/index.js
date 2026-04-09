require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();
const JWT_SECRET = 'secreto_super_seguro_gestor_tareas_123';

app.use(cors({
  origin: 'http://localhost:4200',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// CONFIGURACIÓN DE LA CONEXIÓN
console.log("=== DEBUG RAILWAY ===");
console.log("Variables detectadas:", Object.keys(process.env).join(', '));
if (process.env.MYSQL_URL) console.log("=> ¡MYSQL_URL fue encontrada!");
else console.log("=> MYSQL_URL NO está definida.");

const dbUrl = process.env.MYSQL_URL || process.env.DATABASE_URL;
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',      // Usuario por defecto de XAMPP
    password: process.env.DB_PASSWORD || '123456',      // Cambia esto si tienes contraseña
    database: process.env.DB_NAME || 'gestor_tareas',
    port: process.env.DB_PORT || 3306
};

const db = dbUrl ? mysql.createConnection(dbUrl) : mysql.createConnection(dbConfig);

db.connect(async (err) => {
    if (err) {
        console.error('❌ Error conectando a la BD:', err);
        return;
    }
    console.log('✅ Conectado a MySQL');

    // Crear la tabla de administradores si no existe
    const createAdminsTableQuery = `
      CREATE TABLE IF NOT EXISTS administradores (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(100) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL
      )
    `;

    const createTareasTableQuery = `
      CREATE TABLE IF NOT EXISTS tareas (
        id          INT AUTO_INCREMENT PRIMARY KEY,
        idUsuario   VARCHAR(50) NOT NULL,
        titulo      VARCHAR(255) NOT NULL,
        descripcion TEXT,
        fechaLimite DATE,
        estado      ENUM('pendiente','completada') DEFAULT 'pendiente'
      )
    `;

    db.query(createTareasTableQuery, (err) => {
        if (err) console.error('❌ Error creando tabla de tareas:', err);
    });

    db.query(createAdminsTableQuery, (err) => {
        if (err) {
            console.error('❌ Error creando tabla de administradores:', err);
            return;
        }

        // Auto-Seeding: Verificar si hay admins
        db.query('SELECT COUNT(*) AS count FROM administradores', async (err, results) => {
            if (!err && results[0].count === 0) {
                const hashed = await bcrypt.hash('admin123', 10);
                db.query('INSERT INTO administradores (username, password) VALUES (?, ?)', ['admin', hashed], (err, res) => {
                    if (!err) console.log('🌱 Admin por defecto creado (admin/admin123)');
                });
            }
        });
    });
});

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
        if (err) return res.status(500).json({ error: 'Error del servidor' });
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
    db.query(query, [titulo, descripcion, fechaLimite, id], (err, result) => {
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
        if (err) return res.status(500).send(err);
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
    const query = 'INSERT INTO tareas (idUsuario, titulo, descripcion, fechaLimite) VALUES (?, ?, ?, ?)';
    db.query(query, [idUsuario, titulo, descripcion, fechaLimite], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send(err);
        }
        res.json({ message: 'Tarea guardada', id: result.insertId });
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor en puerto ${PORT}`);
});
