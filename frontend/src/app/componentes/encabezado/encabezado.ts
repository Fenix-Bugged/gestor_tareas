import { Component, EventEmitter, inject, Output } from '@angular/core';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-encabezado',
  standalone: true,
  templateUrl: './encabezado.html',
  styleUrl: './encabezado.css',
})
export class Encabezado {
  authService = inject(AuthService);
  
  @Output() abrirLogin = new EventEmitter<void>();
  @Output() abrirGestor = new EventEmitter<void>();
  @Output() abrirGestorUsuarios = new EventEmitter<void>();
  @Output() resetear = new EventEmitter<void>();

  onLogoClick() {
    this.resetear.emit();
  }

  onAuthAction() {
    if (this.authService.isLoggedIn()) {
      this.authService.logout();
    } else {
      this.abrirLogin.emit();
    }
  }

  onGestorAction() {
    this.abrirGestor.emit();
  }

  onGestorUsuariosAction() {
    this.abrirGestorUsuarios.emit();
  }
}
