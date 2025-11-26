import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AuthTokenStorageService {
  private readonly TOKEN_KEY = 'auth_token';
  private storage: Storage = sessionStorage;

  usarLocalStorage(): void {
    this.storage = localStorage;
  }

  usarSessionStorage(): void {
    this.storage = sessionStorage;
  }

  salvarToken(token: string): void {
    this.storage.setItem(this.TOKEN_KEY, token);
  }

  getToken(): string | null {
    return this.storage.getItem(this.TOKEN_KEY);
  }

  limparToken(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    sessionStorage.removeItem(this.TOKEN_KEY);
  }
}
