import { Component, EventEmitter, Output, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  @Output() cerrar = new EventEmitter<void>();
  
  private authService = inject(AuthService);

  username = signal('');
  password = signal('');
  errorMsg = signal('');

  onSubmit() {
    this.authService.login(this.username(), this.password()).subscribe({
      next: () => {
        this.errorMsg.set('');
        this.cerrar.emit();
      },
      error: (err) => {
        this.errorMsg.set(err.error?.error || 'Error al iniciar sesión');
      }
    });
  }

  onCancel() {
    this.cerrar.emit();
  }
}
