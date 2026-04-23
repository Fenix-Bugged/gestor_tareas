import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';

export interface AdminModel {
  id: number;
  username: string;
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private http = inject(HttpClient);
  private readonly API = 'http://localhost:3000/administradores';

  admins = signal<AdminModel[]>([]);
  cargando = signal(false);

  cargar(): void {
    this.cargando.set(true);
    this.http.get<AdminModel[]>(this.API).subscribe({
      next: (data) => {
        this.admins.set(data);
        this.cargando.set(false);
      },
      error: (err) => {
        console.error('Error cargando admins', err);
        this.cargando.set(false);
      }
    });
  }

  crear(username: string, password: string) {
    return this.http.post<{ message: string, id: number }>(this.API, { username, password })
      .pipe(
        tap((res) => {
          this.admins.update(lista => [...lista, { id: res.id, username }]);
        })
      );
  }

  editar(id: number, username: string, password?: string) {
    return this.http.put<{ message: string }>(`${this.API}/${id}`, { username, password })
      .pipe(
        tap(() => {
          this.admins.update(lista =>
            lista.map(a => (a.id === id ? { ...a, username } : a))
          );
        })
      );
  }

  eliminar(id: number) {
    return this.http.delete(`${this.API}/${id}`)
      .pipe(
        tap(() => {
          this.admins.update(lista => lista.filter(a => a.id !== id));
        })
      );
  }
}
