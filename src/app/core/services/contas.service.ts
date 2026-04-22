import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environments';

export interface ContaCreateDTO {
  nome: string;
  tipo: string; // ex: 'CONTA_CORRENTE' | 'CARTEIRA' etc (ajuste ao seu enum)
  saldoInicial?: number;
  cor?: string;
}

export interface ContaResponseDTO {
  id: number;
  nome: string;
  tipo: string;
  saldoInicial: number;
  cor?: string;
}

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
}
