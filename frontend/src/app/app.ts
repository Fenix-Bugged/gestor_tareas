import { Component, signal, inject, OnInit } from '@angular/core';
import { Encabezado } from './componentes/encabezado/encabezado';
import { Login } from './componentes/login/login';
import { Tareas } from './componentes/tareas/tareas';
import { Usuario } from './componentes/usuario/usuario';
import { GestorAdmins } from './componentes/gestor-admins/gestor-admins';
import { GestorUsuarios } from './componentes/gestor-usuarios/gestor-usuarios';
import { UsuariosService } from './services/usuarios.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [Encabezado, Login, Tareas, Usuario, GestorAdmins, GestorUsuarios],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class AppComponent implements OnInit {
  usuariosService = inject(UsuariosService);

  mostrandoLogin = signal(false);
  mostrandoGestorAdmins = signal(false);
  mostrandoGestorUsuarios = signal(false);

  idUsuarioSeleccionado = signal<number | null>(null);

  get usuarioSeleccionado() {
    return this.usuariosService.usuarios().find((u) => u.id === this.idUsuarioSeleccionado());
  }

  ngOnInit() {
    this.usuariosService.cargar();
  }

  alSeleccionarUsuario(id: number) {
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

  abrirGestorUsuarios() {
    this.mostrandoGestorUsuarios.set(true);
  }

  cerrarGestorUsuarios() {
    this.mostrandoGestorUsuarios.set(false);
    // Recargar usuarios por si se crearon/editaron/borraron
    this.usuariosService.cargar();
  }

  resetearFiltros() {
    this.idUsuarioSeleccionado.set(null);
  }
}
