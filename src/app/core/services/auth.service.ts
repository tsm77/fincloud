// auth.service.ts
import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environments';

export interface LoginRequest {
  email: string;
  senha: string;
}

export interface LoginResponse {
  token: string; // <- seu backend retorna isso
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl;

  login(payload: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(
      `${this.baseUrl}/api/usuarios/login`,
      payload,
    );
  }

  getToken(): string | null {
    return sessionStorage.getItem('token'); // ou localStorage (se você escolheu)
  }

  setToken(token: string) {
    sessionStorage.setItem('token', token);
  }

  logout(): void {
    sessionStorage.removeItem('token');
  }
}
