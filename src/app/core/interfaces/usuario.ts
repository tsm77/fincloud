export interface Usuario {
  nome: string;
  email: string;
  senha: string;
}

export interface UsuarioResponse {
  id?: string;
  nome?: string;
  email?: string;
  senha?: string;
}
