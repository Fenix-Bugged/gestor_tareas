DROP TABLE IF EXISTS tareas;
DROP TABLE IF EXISTS administradores;

CREATE TABLE administradores (
  id       INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL
);

CREATE TABLE tareas (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  idUsuario   VARCHAR(50) NOT NULL,
  titulo      VARCHAR(255) NOT NULL,
  descripcion TEXT,
  fechaLimite DATE,
  estado      ENUM('pendiente','completada') DEFAULT 'pendiente'
);
