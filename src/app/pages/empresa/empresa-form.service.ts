import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Empresa } from 'src/app/models/empresa/empresa.model';
import { ApiService } from 'src/app/services/api.service';

@Injectable({
  providedIn: 'root'
})
export class EmpresaFormService {
  private readonly endpoint = 'api/empresas'; 

  constructor(private api: ApiService) {}

  cadastrarEmpresaFormData(formData: FormData): Observable<any> {
    return this.api.post<any>('api/empresas', formData);
  }

  buscarEmpresa(id: number): Observable<Empresa> {
    return this.api.get<Empresa>(`${this.endpoint}/${id}`);
  }
}
