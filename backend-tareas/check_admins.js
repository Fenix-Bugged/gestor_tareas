const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '123456',
    database: 'gestor_tareas'
});

db.connect((err) => {
    if (err) throw err;
    db.query('SELECT * FROM administradores', (err, results) => {
        if (err) throw err;
        console.log("Admins currently in DB:", results);
        process.exit(0);
    });
});
