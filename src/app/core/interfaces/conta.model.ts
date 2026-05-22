import { BackendTipoConta, TipoConta } from './tipo-conta.enum';

export interface ContaResponseDTO {
  id: number;
  nome: string;
  tipo: BackendTipoConta | string;
  saldo?: number | null;
  ativa?: boolean | null;
}

export interface ContaCreateDTO {
  nome: string;
  tipo: BackendTipoConta;
}

export interface Conta {
  id: number;
  nome: string;
  tipo: TipoConta;
  saldo: number;
  arquivada?: boolean;
}

export interface ContaUpdateDTO {
  nome: string;
  tipo: BackendTipoConta;
}
