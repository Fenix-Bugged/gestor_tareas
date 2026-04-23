const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '123456',
    database: 'gestor_tareas'
});

const usuarios = [
    { nombre: 'Antonia Céspedes', avatar: 'usuario1.png' },
    { nombre: 'Oscar Torres', avatar: 'usuario2.png' },
    { nombre: 'Marcos Jeremías', avatar: 'usuario3.png' },
    { nombre: 'Dania Mercado', avatar: 'usuario4.png' },
    { nombre: 'Carlos Menendez', avatar: 'usuario5.jpg' },
    { nombre: 'Juan Diaz', avatar: 'usuario6.jpg' },
];

db.connect((err) => {
    if (err) throw err;
    console.log('Conectado a la base de datos.');

    let insertados = 0;
    usuarios.forEach((u) => {
        db.query('INSERT INTO usuarios (nombre, avatar) VALUES (?, ?)', [u.nombre, u.avatar], (err) => {
            if (err) {
                console.error(`Error insertando ${u.nombre}:`, err.message);
            } else {
                console.log(`✅ Usuario "${u.nombre}" creado.`);
            }
            insertados++;
            if (insertados === usuarios.length) {
                console.log('\n🌱 Todos los usuarios han sido creados.');
                process.exit(0);
            }
        });
    });
});
