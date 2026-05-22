export type BackendTipoConta =
  | 'CARTEIRA'
  | 'CAIXA'
  | 'CARTAO_CREDITO'
  | 'CONTA_CORRENTE'
  | 'INVESTIMENTO'
  | 'SALARIO'
  | 'CONTA_POUPANCA';

export type TipoConta =
  | 'Conta Corrente'
  | 'Carteira'
  | 'Caixa'
  | 'Cartão de Crédito'
  | 'Investimento'
  | 'Salario'
  | 'Conta Poupança';

export const BACK_TO_UI: Record<BackendTipoConta, TipoConta> = {
  CONTA_CORRENTE: 'Conta Corrente',
  CARTEIRA: 'Carteira',
  CAIXA: 'Caixa',
  CARTAO_CREDITO: 'Cartão de Crédito',
  INVESTIMENTO: 'Investimento',
  SALARIO: 'Salario',
  CONTA_POUPANCA: 'Conta Poupança',
};

export const UI_TO_BACK: Record<TipoConta, BackendTipoConta> = {
  'Conta Corrente': 'CONTA_CORRENTE',
  Carteira: 'CARTEIRA',
  Caixa: 'CAIXA',
  'Cartão de Crédito': 'CARTAO_CREDITO',
  Investimento: 'INVESTIMENTO',
  Salario: 'SALARIO',
  'Conta Poupança': 'CONTA_POUPANCA',
};
