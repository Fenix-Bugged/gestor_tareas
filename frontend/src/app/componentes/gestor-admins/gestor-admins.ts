import { Component, EventEmitter, OnInit, Output, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../services/admin.service';

@Component({
  selector: 'app-gestor-admins',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './gestor-admins.html',
  styleUrl: './gestor-admins.css'
})
export class GestorAdmins implements OnInit {
  adminService = inject(AdminService);
  @Output() cerrar = new EventEmitter<void>();

  nuevoAdminUsuario = '';
  nuevoAdminClave = '';
  errorMsg = signal('');
  successMsg = signal('');

  adminEditandoId = signal<number | null>(null);
  adminEditandoUsuario = '';
  adminEditandoClave = '';

  ngOnInit() {
    this.adminService.cargar();
  }

  crearAdmin() {
    if (!this.nuevoAdminUsuario.trim() || !this.nuevoAdminClave.trim()) return;
    
    this.adminService.crear(this.nuevoAdminUsuario, this.nuevoAdminClave).subscribe({
      next: () => {
        this.successMsg.set('Administrador creado con éxito');
        this.errorMsg.set('');
        this.nuevoAdminUsuario = '';
        this.nuevoAdminClave = '';
        setTimeout(() => this.successMsg.set(''), 3000);
      },
      error: (err) => {
        this.errorMsg.set(err.error?.error || 'Error al crear');
        this.successMsg.set('');
      }
    });
  }

  empezarEdicion(admin: { id: number, username: string }) {
    this.adminEditandoId.set(admin.id);
    this.adminEditandoUsuario = admin.username;
    this.adminEditandoClave = ''; 
  }

  cancelarEdicion() {
    this.adminEditandoId.set(null);
  }

  guardarEdicion() {
    const id = this.adminEditandoId();
    if (!id || !this.adminEditandoUsuario.trim()) return;

    this.adminService.editar(id, this.adminEditandoUsuario, this.adminEditandoClave).subscribe({
      next: () => {
        this.successMsg.set('Perfil administrativo actualizado');
        this.errorMsg.set('');
        setTimeout(() => this.successMsg.set(''), 3000);
        this.cancelarEdicion();
      },
      error: (err) => {
        this.errorMsg.set(err.error?.error || 'Error al actualizar perfil');
        this.successMsg.set('');
      }
    });
  }

  borrarAdmin(id: number) {
    if (confirm('¿Estás seguro de eliminar este administrador?')) {
      this.adminService.eliminar(id).subscribe({
        next: () => {
          this.errorMsg.set('');
        },
        error: (err) => {
          this.errorMsg.set(err.error?.error || 'Error al borrar');
        }
      });
    }
  }

  cerrarModal() {
    this.cerrar.emit();
  }
}
