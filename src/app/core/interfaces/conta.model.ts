import { BackendTipoConta, TipoConta } from './tipo-conta.enum';

export interface ContaResponseDTO {
  id: number | string;
  nome: string;
  tipo: BackendTipoConta | string;
  saldoInicial?: number | null;
  saldo?: number | null;
  cor?: string | null;
  ativa?: boolean | null;
}

export interface ContaCreateDTO {
  nome: string;
  tipo: BackendTipoConta;
  saldoInicial: number;
  cor: string;
}

export interface Conta {
  id: number;
  nome: string;
  tipo: TipoConta;
  saldo: number;
  cor: string;
  arquivada?: boolean;
}
