import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environments';
import { Transacao, TransacaoCreateDto } from '../interfaces/transacoes.model';

@Injectable({ providedIn: 'root' })
export class TransacoesService {
  private readonly http = inject(HttpClient);

  // Ajuste se você tiver environment.baseUrl
  private baseUrl = `${environment.apiUrl}/api/transacoes`;

  listar() {
    return this.http.get<Transacao[]>(this.baseUrl);
  }

  buscarPorId(id: number) {
    return this.http.get<Transacao>(`${this.baseUrl}/${id}`);
  }

  criar(dto: TransacaoCreateDto) {
    return this.http.post<Transacao>(this.baseUrl, dto);
  }

  editar(id: number, dto: TransacaoCreateDto) {
    return this.http.put<Transacao>(`${this.baseUrl}/${id}`, dto);
  }

  remover(id: number) {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
  atualizarPago(id: number, pago: boolean) {
    return this.http.patch<void>(`${this.baseUrl}/${id}/pago?pago=${pago}`, {});
  }
}
