import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClient } from '../api/api-client';
import {
  TicketBoard,
  TicketCommentCreate,
  TicketCreate,
  TicketDetail,
  TicketListItem,
  TicketOwner,
  TicketStatus,
  TicketSummary,
  TicketType,
} from '../models/ticket.model';
import { Page } from '../models/page.model';

@Injectable({ providedIn: 'root' })
export class TicketService {
  private api = inject(ApiClient);

  getBoard(): Observable<TicketBoard> {
    return this.api.get('/tickets/board');
  }

  getSummary(): Observable<TicketSummary> {
    return this.api.get('/tickets/summary');
  }

  getById(id: number): Observable<TicketDetail> {
    return this.api.get('/tickets/{id}', { path: { id } });
  }

  getAll(
    page = 0,
    size = 20,
    sort = 'createdAt,desc',
    filters?: { type?: TicketType; status?: TicketStatus; owner?: TicketOwner },
  ): Observable<Page<TicketListItem>> {
    return this.api.get('/tickets', {
      query: {
        page,
        size,
        sort,
        type: filters?.type || undefined,
        status: filters?.status || undefined,
        owner: filters?.owner || undefined,
      },
    });
  }

  create(dto: TicketCreate): Observable<TicketDetail> {
    return this.api.post('/tickets', { body: dto });
  }

  setStatus(id: number, status: TicketStatus): Observable<TicketDetail> {
    return this.api.patch('/tickets/{id}/status', { path: { id }, body: { status } });
  }

  setOwner(id: number, owner: TicketOwner): Observable<TicketDetail> {
    return this.api.patch('/tickets/{id}/owner', { path: { id }, body: { owner } });
  }

  handToAi(id: number): Observable<TicketDetail> {
    return this.api.post('/tickets/{id}/hand-to-ai', { path: { id }, body: {} });
  }

  wontDo(id: number, comment?: string): Observable<TicketDetail> {
    return this.api.post('/tickets/{id}/wont-do', { path: { id }, body: { comment } });
  }

  addComment(id: number, dto: TicketCommentCreate): Observable<TicketDetail> {
    return this.api.post('/tickets/{id}/comments', { path: { id }, body: dto });
  }
}
