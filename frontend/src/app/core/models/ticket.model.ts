import type { components } from '../api/api-types';

export type TicketOwner = components['schemas']['TicketOwner'];
export type TicketType = components['schemas']['TicketType'];
export type TicketStatus = components['schemas']['TicketStatus'];
export type TicketSolution = components['schemas']['TicketSolution'];
export type TicketCommentAuthor = components['schemas']['TicketCommentAuthor'];

export type TicketComment = components['schemas']['TicketComment'];
export type TicketDetail = components['schemas']['TicketDetail'];
export type TicketListItem = components['schemas']['TicketListItem'];
export type Ticket = TicketDetail;
export type TicketBoard = components['schemas']['TicketBoard'];
export type TicketSummary = components['schemas']['TicketSummary'];
export type TicketCreate = components['schemas']['TicketCreateInput'];
export type TicketCommentCreate = components['schemas']['TicketCommentInput'];
