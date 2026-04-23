import { Component, EventEmitter, OnInit, Output, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UsuariosService, UsuarioModel } from '../../services/usuarios.service';
import { getApiUrl } from '../../config';

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
  nuevoAvatarFile: File | null = null;
  nuevoAvatarPreview: string | null = null;
  errorMsg = signal('');
  successMsg = signal('');

  editandoId = signal<number | null>(null);
  editandoNombre = '';
  editandoAvatarFile: File | null = null;
  editandoAvatarPreview: string | null = null;

  getApiUrl() {
    return getApiUrl();
  }

  ngOnInit() {
    this.usuariosService.cargar();
  }

  onFileSelected(event: any, isEdit: boolean = false) {
    const file: File = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        if (isEdit) {
          this.editandoAvatarFile = file;
          this.editandoAvatarPreview = e.target.result;
        } else {
          this.nuevoAvatarFile = file;
          this.nuevoAvatarPreview = e.target.result;
        }
      };
      reader.readAsDataURL(file);
    }
  }

  crearUsuario() {
    if (!this.nuevoNombre.trim()) return;

    this.usuariosService.agregar(this.nuevoNombre, this.nuevoAvatarFile || 'default-avatar.png');
    this.successMsg.set('Usuario creado con éxito');
    this.errorMsg.set('');
    this.nuevoNombre = '';
    this.nuevoAvatarFile = null;
    this.nuevoAvatarPreview = null;
    setTimeout(() => this.successMsg.set(''), 3000);
  }

  empezarEdicion(usuario: UsuarioModel) {
    this.editandoId.set(usuario.id);
    this.editandoNombre = usuario.nombre;
    this.editandoAvatarFile = null;
    this.editandoAvatarPreview = usuario.avatar ? `${getApiUrl()}/uploads/${usuario.avatar}` : 'img/default-avatar.png';
  }

  cancelarEdicion() {
    this.editandoId.set(null);
    this.editandoAvatarFile = null;
    this.editandoAvatarPreview = null;
  }

  guardarEdicion() {
    const id = this.editandoId();
    if (!id || !this.editandoNombre.trim()) return;

    this.usuariosService.editar(id, {
      nombre: this.editandoNombre,
      avatar: this.editandoAvatarFile || this.editandoAvatarPreview?.replace(`${getApiUrl()}/uploads/`, '') || 'default-avatar.png'
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
