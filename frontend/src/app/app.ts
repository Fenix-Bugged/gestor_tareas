import { Component, signal } from '@angular/core';
import { Encabezado } from './componentes/encabezado/encabezado';
import { Login } from './componentes/login/login';
import { Tareas } from './componentes/tareas/tareas';
import { Usuario } from './componentes/usuario/usuario';
import { GestorAdmins } from './componentes/gestor-admins/gestor-admins';
import { USUARIOS_FALSOS } from './usuarios-falsos';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [Encabezado, Login, Tareas, Usuario, GestorAdmins],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class AppComponent {
  mostrandoLogin = signal(false);
  mostrandoGestorAdmins = signal(false);

  usuarios = USUARIOS_FALSOS;
  idUsuarioSeleccionado = signal<string>('u1');

  get usuarioSeleccionado() {
    return this.usuarios.find((u) => u.id === this.idUsuarioSeleccionado());
  }

  alSeleccionarUsuario(id: string) {
    this.idUsuarioSeleccionado.set(id);
  }

  abrirLogin() {
    this.mostrandoLogin.set(true);
  }

  cerrarLogin() {
    this.mostrandoLogin.set(false);
  }

  abrirGestorAdmins() {
    this.mostrandoGestorAdmins.set(true);
  }

  cerrarGestorAdmins() {
    this.mostrandoGestorAdmins.set(false);
  }

  resetearFiltros() {
    this.idUsuarioSeleccionado.set('');
  }
}
