import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClient } from '../api/api-client';
import { Page } from '../models/page.model';
import { Person, PersonCreate } from '../models/person.model';

@Injectable({ providedIn: 'root' })
export class PersonService {
  private api = inject(ApiClient);

  getAll(page = 0, size = 10, sort = 'lastName,asc', search = '', abteilungId?: number): Observable<Page<Person>> {
    return this.api.get('/personen', { query: { page, size, sort, search, abteilungId } });
  }

  listAll(abteilungId?: number): Observable<Person[]> {
    return this.api.get('/personen/all', { query: { abteilungId } });
  }

  getById(id: number): Observable<Person> {
    return this.api.get('/personen/{id}', { path: { id } });
  }

  create(person: PersonCreate): Observable<Person> {
    return this.api.post('/personen', { body: person });
  }

  update(id: number, person: PersonCreate): Observable<Person> {
    return this.api.put('/personen/{id}', { path: { id }, body: person });
  }

  delete(id: number): Observable<void> {
    return this.api.delete('/personen/{id}', { path: { id } });
  }
}
