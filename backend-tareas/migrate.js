const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '1234',
    database: 'gestor_tareas'
});

db.connect((err) => {
    if (err) throw err;
    db.query('ALTER TABLE tareas ADD COLUMN fechaLimite DATE;', (err, results) => {
        if (err) {
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log('Column already exists - skipping.');
                process.exit(0);
            }
            throw err;
        }
        console.log('Column fechaLimite added successfully!');
        process.exit(0);
    });
});
