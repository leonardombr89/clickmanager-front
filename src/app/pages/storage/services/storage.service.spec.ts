import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { StorageService } from './storage.service';

describe('StorageService', () => {
  let service: StorageService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), StorageService],
    });
    service = TestBed.inject(StorageService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('lists files with filters', () => {
    service.listarArquivos({ page: 1, size: 10, status: 'ATIVO', contexto: 'SITE' }).subscribe();

    const req = http.expectOne((request) =>
      request.url === 'http://localhost:8080/api/storage/arquivos' &&
      request.params.get('page') === '1' &&
      request.params.get('size') === '10' &&
      request.params.get('status') === 'ATIVO' &&
      request.params.get('contexto') === 'SITE'
    );
    expect(req.request.method).toBe('GET');
    req.flush({ content: [], totalElements: 0 });
  });

  it('gets signed url with variant', () => {
    service.buscarUrl(10, 'CARD').subscribe();

    const req = http.expectOne((request) =>
      request.url === 'http://localhost:8080/api/storage/arquivos/10/url' &&
      request.params.get('variante') === 'CARD'
    );
    expect(req.request.method).toBe('GET');
    req.flush({ url: 'card.webp' });
  });

  it('uses arquivoId for trash, restore, definitive delete and reconciliation', () => {
    service.moverParaLixeira(10).subscribe();
    const trashReq = http.expectOne('http://localhost:8080/api/storage/arquivos/10/lixeira');
    expect(trashReq.request.method).toBe('PATCH');
    trashReq.flush(null);

    service.restaurar(10).subscribe();
    const restoreReq = http.expectOne('http://localhost:8080/api/storage/arquivos/10/restaurar');
    expect(restoreReq.request.method).toBe('POST');
    restoreReq.flush(null);

    service.excluirDefinitivo(10).subscribe();
    const definitiveReq = http.expectOne('http://localhost:8080/api/storage/arquivos/10/definitivo');
    expect(definitiveReq.request.method).toBe('DELETE');
    definitiveReq.flush(null);

    service.reconciliar().subscribe();
    const reconciliationReq = http.expectOne('http://localhost:8080/api/storage/reconciliacao');
    expect(reconciliationReq.request.method).toBe('POST');
    reconciliationReq.flush({ verificados: 1 });
  });

  it('uploads video and polls until ATIVO', fakeAsync(() => {
    const file = new File(['v'], 'video.mp4', { type: 'video/mp4' });
    service.uploadVideo({ file, contexto: 'VIDEO', titulo: 'Video' }).subscribe();

    const uploadReq = http.expectOne('http://localhost:8080/api/storage/videos');
    expect(uploadReq.request.method).toBe('POST');
    const body = uploadReq.request.body as FormData;
    expect(body.get('contexto')).toBe('VIDEO');
    expect(body.get('titulo')).toBe('Video');
    expect(body.has('empresaSlug')).toBeFalse();
    uploadReq.flush({ arquivoId: 7, status: 'PROCESSANDO' });

    const statuses: string[] = [];
    service.acompanharVideo(7).subscribe((video) => statuses.push(String(video.status)));

    tick(0);
    http.expectOne('http://localhost:8080/api/storage/videos/7').flush({ arquivoId: 7, status: 'PROCESSANDO' });
    tick(5000);
    http.expectOne('http://localhost:8080/api/storage/videos/7').flush({ arquivoId: 7, status: 'ATIVO' });

    expect(statuses).toEqual(['PROCESSANDO', 'ATIVO']);
  }));

  it('polls until FALHA', fakeAsync(() => {
    const statuses: string[] = [];
    service.acompanharVideo(8).subscribe((video) => statuses.push(String(video.status)));

    tick(0);
    http.expectOne('http://localhost:8080/api/storage/videos/8').flush({ arquivoId: 8, status: 'FALHA' });

    expect(statuses).toEqual(['FALHA']);
  }));
});
