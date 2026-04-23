import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { TareaModel } from '../tarea/tarea.model';
import { getApiUrl } from '../config';

@Injectable({
  providedIn: 'root'
})
export class TareasService {
  private http = inject(HttpClient);
  private readonly API = `${getApiUrl()}/tareas`;

  tareas = signal<TareaModel[]>([]);
  cargando = signal<boolean>(false);

  cargar(idUsuario: number): void {
    this.cargando.set(true);
    this.http.get<TareaModel[]>(`${this.API}?idUsuario=${idUsuario}`).subscribe({
      next: (data) => {
        this.tareas.set(data);
        this.cargando.set(false);
      },
      error: (err) => {
        console.error('Error al cargar tareas:', err);
        this.cargando.set(false);
      },
    });
  }

  agregar(idUsuario: number, titulo: string, descripcion: string, fechaLimite: string): void {
    const body = {
      idUsuario,
      titulo,
      descripcion: descripcion || null,
      fechaLimite: fechaLimite || null
    };
    this.http.post<{ message: string; id: number }>(this.API, body).subscribe({
      next: (res) => {
        // Recargar las tareas del servidor para asegurar consistencia
        this.cargar(idUsuario);
      },
      error: (err) => console.error('Error al agregar tarea:', err)
    });
  }

  completar(id: number): void {
    this.http.put<{ message: string }>(`${this.API}/${id}`, {}).subscribe({
      next: () => {
        this.tareas.update(lista =>
          lista.map(t => (t.id === id ? { ...t, estado: 'completada' } : t))
        );
      },
      error: (err) => console.error('Error al completar tarea:', err),
    });
  }

  editar(id: number, datos: { titulo: string; descripcion: string; fechaLimite: string }): void {
    this.http.put<{ message: string }>(`${this.API}/${id}/editar`, datos).subscribe({
      next: () => {
        this.tareas.update(lista =>
          lista.map(t => (t.id === id ? { ...t, ...datos } : t))
        );
      },
      error: (err) => console.error('Error al editar tarea:', err),
    });
  }

  borrar(id: number): void {
    this.http.delete<{ message: string }>(`${this.API}/${id}`).subscribe({
      next: () => {
        this.tareas.update(lista => lista.filter(t => t.id !== id));
      },
      error: (err) => console.error('Error al borrar tarea:', err),
    });
  }
}
