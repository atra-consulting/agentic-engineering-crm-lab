import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClient } from '../api/api-client';
import { Adresse, AdresseCreate } from '../models/adresse.model';
import { Page } from '../models/page.model';

@Injectable({ providedIn: 'root' })
export class AdresseService {
  private api = inject(ApiClient);

  getAll(page = 0, size = 10, sort = 'city,asc'): Observable<Page<Adresse>> {
    return this.api.get('/adressen', { query: { page, size, sort } });
  }

  listAll(): Observable<Adresse[]> {
    return this.api.get('/adressen/all');
  }

  getById(id: number): Observable<Adresse> {
    return this.api.get('/adressen/{id}', { path: { id } });
  }

  create(adresse: AdresseCreate): Observable<Adresse> {
    return this.api.post('/adressen', { body: adresse });
  }

  update(id: number, adresse: AdresseCreate): Observable<Adresse> {
    return this.api.put('/adressen/{id}', { path: { id }, body: adresse });
  }

  delete(id: number): Observable<void> {
    return this.api.delete('/adressen/{id}', { path: { id } });
  }
}
