import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClient } from '../api/api-client';
import { Chance, ChanceCreate } from '../models/chance.model';

@Injectable({ providedIn: 'root' })
export class ChanceService {
  private api = inject(ApiClient);

  listAll(): Observable<Chance[]> {
    return this.api.get('/chancen/all');
  }

  getById(id: number): Observable<Chance> {
    return this.api.get('/chancen/{id}', { path: { id } });
  }

  create(chance: ChanceCreate): Observable<Chance> {
    return this.api.post('/chancen', { body: chance });
  }

  update(id: number, chance: ChanceCreate): Observable<Chance> {
    return this.api.put('/chancen/{id}', { path: { id }, body: chance });
  }

  delete(id: number): Observable<void> {
    return this.api.delete('/chancen/{id}', { path: { id } });
  }
}
