export interface JwtPayload {
    sub: string;
    id: number;
    nome: string;
    roles: string[];
    exp: number;
    iat: number;
  }
  