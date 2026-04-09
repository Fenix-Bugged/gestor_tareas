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
    id: string;
    avatar: string;
    nombre: string;
  };

  // ESTA ES LA LÍNEA QUE AGREGAMOS
  @Input({ required: true }) seleccionado!: boolean;

  @Output() seleccionar = new EventEmitter<string>();

  get rutaAvatar() {
    // Mantengo tu ruta de carpeta 'img/'
    return 'img/' + this.usuario.avatar;
  }

  alSeleccionarUsuario() {
    this.seleccionar.emit(this.usuario.id);
  }
}
