import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

import {
  Usuario,
  UsuarioResponse,
  UsuarioUpdate,
} from '../interfaces/usuario';
import { environment } from '../../../environments/environment-prod';

@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl;
  private usuarioAtualState = signal<UsuarioResponse | null>(null);

  readonly usuarioAtual = this.usuarioAtualState.asReadonly();
  readonly nomeUsuario = computed(
    () => this.usuarioAtual()?.nome?.trim() || 'Usuario',
  );

  create(payload: Usuario): Observable<UsuarioResponse> {
    return this.http.post<UsuarioResponse>(
      `${this.baseUrl}/api/usuarios`,
      payload,
    );
  }

  carregarAtual(): Observable<UsuarioResponse> {
    return this.http
      .get<UsuarioResponse>(`${this.baseUrl}/api/usuarios/me`)
      .pipe(tap((usuario) => this.usuarioAtualState.set(usuario)));
  }

  atualizarAtual(payload: UsuarioUpdate): Observable<UsuarioResponse> {
    return this.http
      .put<UsuarioResponse>(`${this.baseUrl}/api/usuarios/me`, payload)
      .pipe(tap((usuario) => this.usuarioAtualState.set(usuario)));
  }

  limparAtual(): void {
    this.usuarioAtualState.set(null);
  }
}
