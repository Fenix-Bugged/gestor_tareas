import { Component, effect, inject, input, signal } from '@angular/core';
import { Tarea } from '../../tarea/tarea';
import { NuevaTarea } from '../nueva-tarea/nueva-tarea';
import { Skeleton } from '../skeleton/skeleton';
import { TareasService } from '../../services/tareas.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-tareas',
  standalone: true,
  imports: [Tarea, NuevaTarea, Skeleton],
  templateUrl: './tareas.html',
  styleUrl: './tareas.css'
})
export class Tareas {
  tareasService = inject(TareasService);
  authService = inject(AuthService);

  idUsuario = input.required<string>();
  nombre = input.required<string>();

  estaAnadiendoTarea = signal(false);

  constructor() {
    // Escuchar el cambio del signal idUsuario para cargar las tareas correctas
    effect(() => {
      this.tareasService.cargar(this.idUsuario());
    });
  }

  alEmpezarAnadirTarea(): void { 
    this.estaAnadiendoTarea.set(true);  
  }
  
  alCerrarAnadirTarea(): void { 
    this.estaAnadiendoTarea.set(false); 
  }

  alAnadirTarea(datosTarea: { titulo: string; descripcion: string; fechaLimite: string }): void {
    this.tareasService.agregar(this.idUsuario(), datosTarea.titulo, datosTarea.descripcion, datosTarea.fechaLimite);
    this.estaAnadiendoTarea.set(false);
  }

  alCompletarTarea(id: number): void {
    this.tareasService.completar(id);
  }

  alBorrarTarea(id: number): void {
    this.tareasService.borrar(id);
  }

  alEditarTarea(id: number, datos: { titulo: string; descripcion: string; fechaLimite: string }): void {
    this.tareasService.editar(id, datos);
  }
}
