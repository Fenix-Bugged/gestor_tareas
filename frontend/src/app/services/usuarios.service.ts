import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';

export interface UsuarioModel {
  id: number;
  nombre: string;
  avatar: string;
}

@Injectable({
  providedIn: 'root'
})
export class UsuariosService {
  private http = inject(HttpClient);
  private readonly API = 'http://localhost:3000/usuarios';

  usuarios = signal<UsuarioModel[]>([]);
  cargando = signal<boolean>(false);
  error = signal<string | null>(null);

  cargar(): void {
    this.cargando.set(true);
    this.error.set(null);
    this.http.get<UsuarioModel[]>(this.API).subscribe({
      next: (data) => {
        this.usuarios.set(data);
        this.cargando.set(false);
      },
      error: (err) => {
        console.error('Error al cargar usuarios:', err);
        this.error.set('Error al cargar usuarios. Inténtalo más tarde.');
        this.cargando.set(false);
      },
    });
  }

  agregar(nombre: string, avatar: string): void {
    const body = { nombre, avatar: avatar || null };
    this.http.post<{ message: string; id: number }>(this.API, body).subscribe({
      next: (res) => {
        this.cargar();
      },
      error: (err) => {
        console.error('Error al agregar usuario:', err);
        this.error.set('Error al agregar usuario.');
      }
    });
  }

  editar(id: number, datos: { nombre: string; avatar: string }): void {
    this.http.put<{ message: string }>(`${this.API}/${id}`, datos).subscribe({
      next: () => {
        this.cargar();
      },
      error: (err) => console.error('Error al editar usuario:', err),
    });
  }

  borrar(id: number): void {
    this.http.delete<{ message: string }>(`${this.API}/${id}`).subscribe({
      next: () => {
        this.cargar();
      },
      error: (err) => console.error('Error al borrar usuario:', err),
    });
  }
}
