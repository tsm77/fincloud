export type CategoriaTipo = 'RECEITA' | 'DESPESA';

export interface Categoria {
  id: number;
  nome: string;
  tipo: CategoriaTipo;
  cor: string;
}

export interface CategoriaCreateDto {
  nome: string;
  tipo: CategoriaTipo;
  cor: string;
}

export interface CategoriaUpdateDto {
  nome: string;
  tipo: CategoriaTipo;
  cor: string;
}
