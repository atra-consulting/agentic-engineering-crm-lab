import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { ApiClient } from './api-client';

describe('ApiClient', () => {
  let api: ApiClient;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(ApiClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('URL building', () => {
    it('prefixes the path with /api', () => {
      api.get('/firmen/all').subscribe();

      const req = httpMock.expectOne('/api/firmen/all');
      expect(req.request.url).toBe('/api/firmen/all');
      req.flush([]);
    });

    it('replaces {id} with a number', () => {
      api.get('/firmen/{id}', { path: { id: 5 } }).subscribe();

      const req = httpMock.expectOne('/api/firmen/5');
      expect(req.request.method).toBe('GET');
      req.flush({});
    });

    it('URL-encodes a string path param', () => {
      api.get('/firmen/{id}', { path: { id: 'a/b' } }).subscribe();

      const req = httpMock.expectOne('/api/firmen/a%2Fb');
      expect(req.request.url).toBe('/api/firmen/a%2Fb');
      req.flush({});
    });

    it('replaces several placeholders in one path', () => {
      api.get('/firmen/{id}/personen', { path: { id: 7 }, query: { page: 0, size: 10 } }).subscribe();

      const req = httpMock.expectOne('/api/firmen/7/personen?page=0&size=10');
      req.flush({});
    });
  });

  describe('query params', () => {
    it('leaves out undefined and null values', () => {
      api.get('/firmen', { query: { page: 0, size: undefined, sort: undefined, search: undefined } }).subscribe();

      const req = httpMock.expectOne((r) => r.url === '/api/firmen');
      expect(req.request.urlWithParams).toBe('/api/firmen?page=0');
      req.flush({});
    });

    it('treats null like undefined', () => {
      const query = { page: 1, search: null } as unknown as { page: number; search: string };
      api.get('/firmen', { query }).subscribe();

      const req = httpMock.expectOne((r) => r.url === '/api/firmen');
      expect(req.request.urlWithParams).toBe('/api/firmen?page=1');
      req.flush({});
    });

    it('keeps an empty string value', () => {
      api.get('/firmen', { query: { page: 0, search: '' } }).subscribe();

      const req = httpMock.expectOne((r) => r.url === '/api/firmen');
      expect(req.request.urlWithParams).toBe('/api/firmen?page=0&search=');
      req.flush({});
    });

    it('keeps the caller key order', () => {
      api.get('/firmen', { query: { search: 'acme', size: 5, page: 2, sort: 'name,asc' } }).subscribe();

      const req = httpMock.expectOne((r) => r.url === '/api/firmen');
      expect(req.request.urlWithParams).toBe('/api/firmen?search=acme&size=5&page=2&sort=name,asc');
      req.flush({});
    });

    it('sends no query string when none is given', () => {
      api.get('/firmen/all').subscribe();

      const req = httpMock.expectOne('/api/firmen/all');
      expect(req.request.urlWithParams).toBe('/api/firmen/all');
      req.flush([]);
    });
  });

  describe('request body', () => {
    it('sends a POST body as given', () => {
      const body = { benutzername: 'admin', passwort: 'admin123' };
      api.post('/auth/login', { body }).subscribe();

      const req = httpMock.expectOne('/api/auth/login');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(body);
      req.flush({});
    });

    it('sends no body when an optional body is omitted', () => {
      api.post('/auth/logout').subscribe();

      const req = httpMock.expectOne('/api/auth/logout');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toBeNull();
      req.flush({});
    });

    it('sends {} as {}', () => {
      api.post('/auth/logout', { body: {} }).subscribe();

      const req = httpMock.expectOne('/api/auth/logout');
      expect(req.request.body).toEqual({});
      req.flush({});
    });
  });

  describe('204 response', () => {
    it('completes without error and emits no JSON body', () => {
      let emitted = false;
      let errored = false;
      let completed = false;
      api.delete('/personen/{id}', { path: { id: 3 } }).subscribe({
        next: (value) => {
          emitted = true;
          expect(value == null).toBeTrue();
        },
        error: () => (errored = true),
        complete: () => (completed = true),
      });

      httpMock.expectOne('/api/personen/3').flush(null, { status: 204, statusText: 'No Content' });

      expect(errored).toBeFalse();
      expect(completed).toBeTrue();
      expect(emitted).toBeTrue();
    });
  });

  describe('HTTP method', () => {
    it('uses GET', () => {
      api.get('/firmen/all').subscribe();
      const req = httpMock.expectOne('/api/firmen/all');
      expect(req.request.method).toBe('GET');
      req.flush([]);
    });

    it('uses POST', () => {
      api.post('/auth/logout', { body: {} }).subscribe();
      expect(httpMock.expectOne('/api/auth/logout').request.method).toBe('POST');
    });

    it('uses PUT', () => {
      api.put('/personen/{id}', { path: { id: 1 }, body: {} as never }).subscribe();
      expect(httpMock.expectOne('/api/personen/1').request.method).toBe('PUT');
    });

    it('uses PATCH', () => {
      api.patch('/tickets/{id}/status', { path: { id: 1 }, body: { status: 'DONE' } }).subscribe();
      expect(httpMock.expectOne('/api/tickets/1/status').request.method).toBe('PATCH');
    });

    it('uses DELETE', () => {
      api.delete('/personen/{id}', { path: { id: 1 } }).subscribe();
      expect(httpMock.expectOne('/api/personen/1').request.method).toBe('DELETE');
    });
  });
});
