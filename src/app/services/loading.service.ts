import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  private activeRequests = 0;
  private loadingStartTime = 0;
  private minDuration = 1000;
  private isForceHiding = false;
  private pendingCallbacks: (() => void)[] = [];
  private loadingElement: HTMLDivElement | null = null;

  show() {
    this.activeRequests++;

    if (this.activeRequests === 1) {
      this.loadingStartTime = Date.now();
      this.createLoadingElement();
      this.loadingElement!.style.display = 'flex';
    }
  }

  hide() {
    if (this.activeRequests > 0) {
      this.activeRequests--;
    }

    if (this.activeRequests === 0 && !this.isForceHiding) {
      const elapsed = Date.now() - this.loadingStartTime;
      const remainingTime = this.minDuration - elapsed;

      if (remainingTime > 0) {
        this.isForceHiding = true;
        setTimeout(() => {
          this.forceHide();
          this.isForceHiding = false;
        }, remainingTime);
      } else {
        this.forceHide();
      }
    }
  }

  private forceHide() {
    if (this.loadingElement) {
      this.loadingElement.style.display = 'none';
    }
    this.pendingCallbacks.forEach(callback => callback());
    this.pendingCallbacks = [];
  }

  runAfterHide(callback: () => void) {
    if (this.activeRequests === 0 && !this.isForceHiding) {
      // Mesmo se nem existiu loading ainda, chamamos na hora
      callback();
    } else {
      this.pendingCallbacks.push(callback);
    }
  }

  isLoading(): boolean {
    return this.activeRequests > 0 || this.isForceHiding;
  }

  private createLoadingElement() {
    if (!this.loadingElement) {
      this.loadingElement = document.createElement('div');
      this.loadingElement.classList.add('loading-overlay');
      this.loadingElement.innerHTML = `
        <div class="spinner"></div>
      `;
      document.body.appendChild(this.loadingElement);
    }
  }
}
