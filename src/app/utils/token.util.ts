import { jwtDecode } from 'jwt-decode';
import { JwtPayload } from '../pages/authentication/jwt-payload.interface';

export function decodeToken(token: string): JwtPayload | null {
    try {
      return jwtDecode<JwtPayload>(token);
    } catch (e) {
      console.error('Erro ao decodificar token:', e);
      return null;
    }
  }

