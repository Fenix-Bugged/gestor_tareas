const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '123456',
    database: 'gestor_tareas'
});

const tareasData = [
  ['u1', 'Revisión de Contratos', 'Revisar los contratos de los nuevos empleados para esta semana.', '2026-04-15'],
  ['u2', 'Mantenimiento de Servidores', 'Actualizar parches de seguridad en la granja de servidores AWS.', '2026-04-10'],
  ['u3', 'Auditoría Financiera', 'Preparar los balances generales para la auditoría de mayo.', '2026-04-20'],
  ['u4', 'Diseño de Campaña', 'Crear los mockups para la campaña publicitaria de fin de año.', '2026-04-25'],
  ['u5', 'Logística de Envíos', 'Coordinar con la empresa de transporte los despachos pendientes.', '2026-04-12'],
  ['u6', 'Entrevistas de Personal', 'Realizar entrevistas para el cargo de gerente de marketing.', '2026-04-18']
];

db.connect((err) => {
    if (err) throw err;
    console.log('✅ Conectado a MySQL para cargar datos...');
    
    const query = 'INSERT INTO tareas (idUsuario, titulo, descripcion, fechaLimite) VALUES ?';
    
    db.query(query, [tareasData], (err, results) => {
        if (err) {
            console.error('❌ Error insertando tareas:', err);
        } else {
            console.log(`✅ ¡Éxito! Se generaron ${results.affectedRows} tareas (Una por cada usuario) en la base de datos.`);
        }
        process.exit(0);
    });
});
