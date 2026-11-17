import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClient } from '../api/api-client';
import { Abteilung, AbteilungCreate } from '../models/abteilung.model';
import { Page } from '../models/page.model';

@Injectable({ providedIn: 'root' })
export class AbteilungService {
  private api = inject(ApiClient);

  getAll(page = 0, size = 10, sort = 'name,asc'): Observable<Page<Abteilung>> {
    return this.api.get('/abteilungen', { query: { page, size, sort } });
  }

  listAll(): Observable<Abteilung[]> {
    return this.api.get('/abteilungen/all');
  }

  getById(id: number): Observable<Abteilung> {
    return this.api.get('/abteilungen/{id}', { path: { id } });
  }

  create(abteilung: AbteilungCreate): Observable<Abteilung> {
    return this.api.post('/abteilungen', { body: abteilung });
  }

  update(id: number, abteilung: AbteilungCreate): Observable<Abteilung> {
    return this.api.put('/abteilungen/{id}', { path: { id }, body: abteilung });
  }

  delete(id: number): Observable<void> {
    return this.api.delete('/abteilungen/{id}', { path: { id } });
  }

  getAllByFirmaId(firmaId: number): Observable<Abteilung[]> {
    return this.api.get('/abteilungen/firma/{firmaId}', { path: { firmaId } });
  }
}
