import { Injectable } from '@angular/core';
import { Observable, timer } from 'rxjs';
import { switchMap, takeWhile } from 'rxjs/operators';
import { ApiService } from 'src/app/services/api.service';
import {
  StorageArquivo,
  StorageArquivoListParams,
  StorageArquivoPage,
  StorageDashboard,
  StorageImageVariantType,
  StorageLixeiraItem,
  StorageReconciliationResult,
  StorageVideo,
  StorageVideoStatus,
  StorageVideoUploadRequest,
  StorageVideoUploadResponse,
  storageParams,
} from '../models/storage.models';

@Injectable({ providedIn: 'root' })
export class StorageService {
  private readonly arquivosEndpoint = 'api/storage/arquivos';
  private readonly lixeiraEndpoint = 'api/storage/lixeira';
  private readonly dashboardEndpoint = 'api/storage/dashboard';
  private readonly reconciliacaoEndpoint = 'api/storage/reconciliacao';
  private readonly videosEndpoint = 'api/storage/videos';

  constructor(private readonly api: ApiService) {}

  listarArquivos(params: StorageArquivoListParams = {}): Observable<StorageArquivoPage<StorageArquivo>> {
    return this.api.get<StorageArquivoPage<StorageArquivo>>(this.arquivosEndpoint, storageParams(params));
  }

  buscarArquivo(arquivoId: number): Observable<StorageArquivo> {
    return this.api.get<StorageArquivo>(`${this.arquivosEndpoint}/${arquivoId}`);
  }

  buscarUrl(arquivoId: number, variante?: StorageImageVariantType): Observable<{ url: string }> {
    return this.api.get<{ url: string }>(
      `${this.arquivosEndpoint}/${arquivoId}/url`,
      variante ? storageParams({ variante } as StorageArquivoListParams) : undefined
    );
  }

  listarLixeira(params: StorageArquivoListParams = {}): Observable<StorageArquivoPage<StorageLixeiraItem>> {
    return this.api.get<StorageArquivoPage<StorageLixeiraItem>>(this.lixeiraEndpoint, storageParams(params));
  }

  dashboard(): Observable<StorageDashboard> {
    return this.api.get<StorageDashboard>(this.dashboardEndpoint);
  }

  moverParaLixeira(arquivoId: number): Observable<void> {
    return this.api.patch<void>(`${this.arquivosEndpoint}/${arquivoId}/lixeira`, {});
  }

  restaurar(arquivoId: number): Observable<void> {
    return this.api.post<void>(`${this.arquivosEndpoint}/${arquivoId}/restaurar`, {});
  }

  excluirDefinitivo(arquivoId: number): Observable<void> {
    return this.api.delete<void>(`${this.arquivosEndpoint}/${arquivoId}/definitivo`);
  }

  reconciliar(): Observable<StorageReconciliationResult> {
    return this.api.post<StorageReconciliationResult>(this.reconciliacaoEndpoint, {});
  }

  uploadVideo(request: StorageVideoUploadRequest): Observable<StorageVideoUploadResponse> {
    const formData = new FormData();
    formData.append('file', request.file, request.file.name);
    formData.append('contexto', request.contexto);
    this.appendOptional(formData, 'titulo', request.titulo);
    this.appendOptional(formData, 'descricao', request.descricao);
    this.appendOptional(formData, 'altText', request.altText);
    this.appendOptional(formData, 'nomeExibicao', request.nomeExibicao);

    return this.api.post<StorageVideoUploadResponse>(this.videosEndpoint, formData);
  }

  buscarVideo(arquivoId: number): Observable<StorageVideo> {
    return this.api.get<StorageVideo>(`${this.videosEndpoint}/${arquivoId}`);
  }

  acompanharVideo(arquivoId: number): Observable<StorageVideo> {
    return timer(0, 5000).pipe(
      switchMap(() => this.buscarVideo(arquivoId)),
      takeWhile((video) => !this.isVideoFinal(video.status), true)
    );
  }

  reprocessarVideo(arquivoId: number): Observable<StorageVideo> {
    return this.api.post<StorageVideo>(`${this.videosEndpoint}/${arquivoId}/reprocessar`, {});
  }

  cancelarVideo(arquivoId: number): Observable<StorageVideo> {
    return this.api.post<StorageVideo>(`${this.videosEndpoint}/${arquivoId}/cancelar`, {});
  }

  moverVideoParaLixeira(arquivoId: number): Observable<void> {
    return this.api.patch<void>(`${this.videosEndpoint}/${arquivoId}/lixeira`, {});
  }

  excluirVideoDefinitivo(arquivoId: number): Observable<void> {
    return this.api.delete<void>(`${this.videosEndpoint}/${arquivoId}/definitivo`);
  }

  isVideoFinal(status?: StorageVideoStatus | null): boolean {
    const normalized = String(status || '').toUpperCase();
    return ['ATIVO', 'FALHA', 'CANCELADO', 'CANCELADA', 'EXCLUIDO', 'LIXEIRA'].includes(normalized);
  }

  private appendOptional(formData: FormData, key: string, value?: string | null): void {
    const normalized = String(value || '').trim();
    if (normalized) {
      formData.append(key, normalized);
    }
  }
}
