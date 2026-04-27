import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  Categoria,
  CategoriaCreateDto,
  CategoriaUpdateDto,
} from '../interfaces/categorias.model';
import { environment } from '../../../environments/environment-prod';

@Injectable({ providedIn: 'root' })
export class CategoriaService {
  private readonly http = inject(HttpClient);

  // Ajuste se você tiver environment.baseUrl
  private baseUrl = `${environment.apiUrl}/api/categorias`;

  listar() {
    return this.http.get<Categoria[]>(this.baseUrl);
  }

  buscarPorId(id: number) {
    return this.http.get<Categoria>(`${this.baseUrl}/${id}`);
  }

  criar(dto: CategoriaCreateDto) {
    return this.http.post<Categoria>(this.baseUrl, dto);
  }

  editar(id: number, dto: CategoriaUpdateDto) {
    return this.http.put<Categoria>(`${this.baseUrl}/${id}`, dto);
  }

  remover(id: number) {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
