import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environments';
import { Usuario, UsuarioResponse } from '../interfaces/usuario';

@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl;

  create(payload: Usuario): Observable<UsuarioResponse> {
    return this.http.post<UsuarioResponse>(
      `${this.baseUrl}/api/usuarios`,
      payload,
    );
  }
}
