import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClient } from '../api/api-client';
import { Abteilung } from '../models/abteilung.model';
import { Firma, FirmaCreate } from '../models/firma.model';
import { Page } from '../models/page.model';
import { Person } from '../models/person.model';

@Injectable({ providedIn: 'root' })
export class FirmaService {
  private api = inject(ApiClient);

  getAll(page = 0, size = 10, sort = 'name,asc', search = ''): Observable<Page<Firma>> {
    return this.api.get('/firmen', { query: { page, size, sort, search } });
  }

  listAll(): Observable<Firma[]> {
    return this.api.get('/firmen/all');
  }

  getById(id: number): Observable<Firma> {
    return this.api.get('/firmen/{id}', { path: { id } });
  }

  create(firma: FirmaCreate): Observable<Firma> {
    return this.api.post('/firmen', { body: firma });
  }

  update(id: number, firma: FirmaCreate): Observable<Firma> {
    return this.api.put('/firmen/{id}', { path: { id }, body: firma });
  }

  delete(id: number): Observable<void> {
    return this.api.delete('/firmen/{id}', { path: { id } });
  }

  getPersonen(id: number, page = 0, size = 10): Observable<Page<Person>> {
    return this.api.get('/firmen/{id}/personen', { path: { id }, query: { page, size } });
  }

  getAbteilungen(id: number, page = 0, size = 10): Observable<Page<Abteilung>> {
    return this.api.get('/firmen/{id}/abteilungen', { path: { id }, query: { page, size } });
  }
}
