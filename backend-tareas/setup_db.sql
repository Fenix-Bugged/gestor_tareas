DROP TABLE IF EXISTS tareas;
DROP TABLE IF EXISTS usuarios;
DROP TABLE IF EXISTS administradores;

CREATE TABLE usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  avatar VARCHAR(255)
);

CREATE TABLE administradores (
  id       INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL
);

CREATE TABLE tareas (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  idUsuario   INT NOT NULL,
  titulo      VARCHAR(255) NOT NULL,
  descripcion TEXT,
  fechaLimite DATE,
  estado      ENUM('pendiente','completada') DEFAULT 'pendiente',
  FOREIGN KEY (idUsuario) REFERENCES usuarios(id) ON DELETE CASCADE
);
