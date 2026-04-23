import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Tarjeta } from '../tarjeta/tarjeta';

@Component({
  selector: 'app-usuario',
  standalone: true,
  imports: [Tarjeta],
  templateUrl: './usuario.html',
  styleUrl: './usuario.css'
})
export class Usuario {
  @Input({ required: true }) usuario!: {
    id: number;
    avatar: string;
    nombre: string;
  };

  // ESTA ES LA LÍNEA QUE AGREGAMOS
  @Input({ required: true }) seleccionado!: boolean;

  @Output() seleccionar = new EventEmitter<number>();

  get rutaAvatar() {
    if (this.usuario.avatar && this.usuario.avatar.startsWith('avatar-')) {
      return 'http://localhost:3000/uploads/' + this.usuario.avatar;
    }
    return 'img/' + (this.usuario.avatar || 'default-avatar.png');
  }

  alSeleccionarUsuario() {
    this.seleccionar.emit(this.usuario.id);
  }
}
