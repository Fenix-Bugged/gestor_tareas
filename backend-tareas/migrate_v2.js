const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '123456',
    database: 'gestor_tareas'
});

db.connect((err) => {
    if (err) throw err;
    console.log('Conectado a la base de datos.');

    db.query('DROP TABLE IF EXISTS tareas', (err) => {
        if (err) throw err;
        console.log('Tabla tareas eliminada.');
        
        db.query('DROP TABLE IF EXISTS usuarios', (err) => {
            if (err) throw err;
            console.log('Tabla usuarios eliminada.');
            process.exit(0);
        });
    });
});
