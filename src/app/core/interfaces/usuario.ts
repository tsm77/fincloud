export interface Usuario {
  nome: string;
  email: string;
  senha: string;
}

export interface UsuarioUpdate {
  nome: string;
  email: string;
  senha?: string;
}

export interface UsuarioResponse {
  id?: number;
  nome?: string;
  email?: string;
  dataCriacao?: string;
}
