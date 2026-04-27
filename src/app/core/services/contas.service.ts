import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Conta,
  ContaCreateDTO,
  ContaResponseDTO,
  ContaUpdateDTO,
} from '../interfaces/conta.model';
import { environment } from '../../../environments/environment-prod';

@Injectable({ providedIn: 'root' })
export class ContaService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/api/contas`;

  listar(): Observable<ContaResponseDTO[]> {
    return this.http.get<ContaResponseDTO[]>(this.baseUrl);
  }

  criar(payload: ContaCreateDTO): Observable<ContaResponseDTO> {
    return this.http.post<ContaResponseDTO>(this.baseUrl, payload);
  }

  remover(id: number) {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  editar(id: number, dto: ContaUpdateDTO) {
    return this.http.put<Conta>(`${this.baseUrl}/${id}`, dto);
  }
}
