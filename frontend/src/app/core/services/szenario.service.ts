import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClient } from '../api/api-client';
import { Szenario, SzenarioCreate, SzenarioUpdate } from '../models/szenario.model';

@Injectable({ providedIn: 'root' })
export class SzenarioService {
  private api = inject(ApiClient);

  list(): Observable<Szenario[]> {
    return this.api.get('/szenarien');
  }

  getById(id: number): Observable<Szenario> {
    return this.api.get('/szenarien/{id}', { path: { id } });
  }

  create(dto: SzenarioCreate): Observable<Szenario> {
    return this.api.post('/szenarien', { body: dto });
  }

  update(id: number, dto: SzenarioUpdate): Observable<Szenario> {
    return this.api.put('/szenarien/{id}', { path: { id }, body: dto });
  }

  delete(id: number): Observable<void> {
    return this.api.delete('/szenarien/{id}', { path: { id } });
  }
}
