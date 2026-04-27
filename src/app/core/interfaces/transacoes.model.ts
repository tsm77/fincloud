export type TipoTransacao = 'RECEITA' | 'DESPESA';

export interface Transacao {
  id: number;
  tipo: TipoTransacao;
  valor: number;
  data: Date;
  descricao: string;
  contaId: number;
  contaNome: string;
  categoriaId: number;
  categoriaNome: string;
  categoriaCor: string;
  dataCriacao: string;
  pago?: boolean; //
}

export interface TransacaoCreateDto {
  contaId: number;
  categoriaId: number;
  tipo: TipoTransacao;
  data: string;

  itens: TransacaoItemDto[];
}

export interface TransacaoItemDto {
  descricao: string;
  valor: number;
  numeroParcela?: number;
  totalParcelas?: number;
}

export interface TransacaoUpdateDto {
  contaId: number;
  categoriaId: number;
  tipo: TipoTransacao;
  valor: number;
  data: string;
  descricao?: string;
}
