import { Component, Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-nueva-tarea',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './nueva-tarea.html',
  styleUrl: './nueva-tarea.css'
})
export class NuevaTarea {
  @Output() cancelar = new EventEmitter<void>();
  @Output() anadir   = new EventEmitter<{ titulo: string; descripcion: string; fechaLimite: string }>();

  tituloIngresado  = '';
  descripcionIngresada = '';
  fechaLimiteIngresada = '';

  alCancelar(): void {
    this.cancelar.emit();
  }

  alEnviar(): void {
    if (!this.tituloIngresado.trim()) return;
    
    this.anadir.emit({
      titulo:  this.tituloIngresado,
      descripcion: this.descripcionIngresada,
      fechaLimite: this.fechaLimiteIngresada
    });
    
    this.tituloIngresado  = '';
    this.descripcionIngresada = '';
    this.fechaLimiteIngresada = '';
  }
}
