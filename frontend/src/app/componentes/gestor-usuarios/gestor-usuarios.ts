import { Component, EventEmitter, OnInit, Output, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UsuariosService, UsuarioModel } from '../../services/usuarios.service';

@Component({
  selector: 'app-gestor-usuarios',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './gestor-usuarios.html',
  styleUrl: './gestor-usuarios.css'
})
export class GestorUsuarios implements OnInit {
  usuariosService = inject(UsuariosService);
  @Output() cerrar = new EventEmitter<void>();

  nuevoNombre = '';
  nuevoAvatar = '';
  errorMsg = signal('');
  successMsg = signal('');

  editandoId = signal<number | null>(null);
  editandoNombre = '';
  editandoAvatar = '';

  avatarsDisponibles = [
    'usuario1.png',
    'usuario2.png',
    'usuario3.png',
    'usuario4.png',
    'usuario5.jpg',
    'usuario6.jpg',
  ];

  ngOnInit() {
    this.usuariosService.cargar();
  }

  crearUsuario() {
    if (!this.nuevoNombre.trim()) return;

    this.usuariosService.agregar(this.nuevoNombre, this.nuevoAvatar || this.avatarsDisponibles[0]);
    this.successMsg.set('Usuario creado con éxito');
    this.errorMsg.set('');
    this.nuevoNombre = '';
    this.nuevoAvatar = '';
    setTimeout(() => this.successMsg.set(''), 3000);
  }

  empezarEdicion(usuario: UsuarioModel) {
    this.editandoId.set(usuario.id);
    this.editandoNombre = usuario.nombre;
    this.editandoAvatar = usuario.avatar || '';
  }

  cancelarEdicion() {
    this.editandoId.set(null);
  }

  guardarEdicion() {
    const id = this.editandoId();
    if (!id || !this.editandoNombre.trim()) return;

    this.usuariosService.editar(id, {
      nombre: this.editandoNombre,
      avatar: this.editandoAvatar
    });
    this.successMsg.set('Usuario actualizado');
    this.errorMsg.set('');
    setTimeout(() => this.successMsg.set(''), 3000);
    this.cancelarEdicion();
  }

  borrarUsuario(id: number) {
    if (confirm('¿Estás seguro de eliminar este usuario? Se borrarán también todas sus tareas.')) {
      this.usuariosService.borrar(id);
      this.errorMsg.set('');
    }
  }

  cerrarModal() {
    this.cerrar.emit();
  }
}
