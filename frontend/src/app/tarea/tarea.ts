import { Component, EventEmitter, input, Output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgClass } from '@angular/common';
import { TareaModel } from './tarea.model';

@Component({
  selector: 'app-tarea',
  standalone: true,
  imports: [FormsModule, NgClass],
  templateUrl: './tarea.html',
  styleUrl: './tarea.css'
})
export class Tarea {

  tarea = input.required<TareaModel>();
  isAdmin = input<boolean>(false);

  @Output() completar = new EventEmitter<number>();
  @Output() borrar    = new EventEmitter<number>();
  @Output() editar    = new EventEmitter<{
    id:    number;
    datos: { titulo: string; descripcion: string; fechaLimite: string };
  }>();

  // Estado local del modal
  editando         = signal(false);
  tituloEditado    = signal('');
  descripcionEditada = signal('');
  fechaEditada     = signal('');

  alCompletarTarea(): void {
    if (this.isAdmin()) {
      this.completar.emit(this.tarea().id);
    }
  }

  alBorrarTarea(): void {
    if (this.isAdmin()) {
      this.borrar.emit(this.tarea().id);
    }
  }

  alEditarTarea(): void {
    if (this.isAdmin()) {
      this.tituloEditado.set(this.tarea().titulo);
      this.descripcionEditada.set(this.tarea().descripcion);
      // Extraer solo YYYY-MM-DD para el input type="date"
      let fecha = this.tarea().fechaLimite;
      if (fecha && fecha.includes('T')) fecha = fecha.split('T')[0];
      this.fechaEditada.set(fecha || '');
      this.editando.set(true);
    }
  }

  alGuardarEdicion(): void {
    this.editar.emit({
      id: this.tarea().id,
      datos: {
        titulo:      this.tituloEditado(),
        descripcion: this.descripcionEditada(),
        fechaLimite: this.fechaEditada()
      }
    });
    this.editando.set(false);
  }

  alCancelarEdicion(): void {
    this.editando.set(false);
  }
}
