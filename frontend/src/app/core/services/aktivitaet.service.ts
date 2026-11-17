import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClient } from '../api/api-client';
import { Aktivitaet, AktivitaetCreate } from '../models/aktivitaet.model';
import { Page } from '../models/page.model';

@Injectable({ providedIn: 'root' })
export class AktivitaetService {
  private api = inject(ApiClient);

  getAll(page = 0, size = 10, sort = 'datum,desc'): Observable<Page<Aktivitaet>> {
    return this.api.get('/aktivitaeten', { query: { page, size, sort } });
  }

  listAll(): Observable<Aktivitaet[]> {
    return this.api.get('/aktivitaeten/all');
  }

  getById(id: number): Observable<Aktivitaet> {
    return this.api.get('/aktivitaeten/{id}', { path: { id } });
  }

  create(aktivitaet: AktivitaetCreate): Observable<Aktivitaet> {
    return this.api.post('/aktivitaeten', { body: aktivitaet });
  }

  update(id: number, aktivitaet: AktivitaetCreate): Observable<Aktivitaet> {
    return this.api.put('/aktivitaeten/{id}', { path: { id }, body: aktivitaet });
  }

  delete(id: number): Observable<void> {
    return this.api.delete('/aktivitaeten/{id}', { path: { id } });
  }
}
