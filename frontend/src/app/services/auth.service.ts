import { Injectable, computed, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  
  // Signal para almacenar el token
  token = signal<string | null>(null);
  
  // Computed para saber si hay sesión iniciada
  isLoggedIn = computed(() => !!this.token());

  constructor() {
    // Restaurar token si existe en localStorage
    const savedToken = localStorage.getItem('token');
    if (savedToken) {
      this.token.set(savedToken);
    }
  }

  login(username: string, password: string) {
    return this.http.post<{ token: string, username: string }>('https://easygoing-nature-production.up.railway.app/login', { username, password })
      .pipe(
        tap(res => {
          this.token.set(res.token);
          localStorage.setItem('token', res.token);
        })
      );
  }

  logout() {
    this.token.set(null);
    localStorage.removeItem('token');
  }
}
