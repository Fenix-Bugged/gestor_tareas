const mysql = require('mysql2');
const fs = require('fs');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '123456',
    database: 'gestor_tareas',
    multipleStatements: true
});

db.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        process.exit(1);
    }
    
    const query = fs.readFileSync('setup_db.sql', 'utf8');
    
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error executing query:', err);
            process.exit(1);
        }
        console.log('Database tables recreated successfully!');
        process.exit(0);
    });
});
