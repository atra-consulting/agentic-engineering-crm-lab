import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, of, switchMap, tap } from 'rxjs';
import { ApiClient } from '../api/api-client';
import { BenutzerInfo, LoginRequest, LoginResponse } from '../models/auth.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private api = inject(ApiClient);
  private router = inject(Router);

  private currentUserSignal = signal<BenutzerInfo | null>(null);

  currentUser = this.currentUserSignal.asReadonly();
  isAuthenticated = computed(() => this.currentUserSignal() !== null);

  login(request: LoginRequest): Observable<LoginResponse> {
    return this.api
      .post('/auth/login', { body: request })
      .pipe(
        switchMap((response) =>
          this.fetchCurrentUser().pipe(
            switchMap(() => of(response)),
          ),
        ),
      );
  }

  logout(): void {
    this.api.post('/auth/logout', { body: {} }).subscribe({
      complete: () => {
        this.clearAuth();
        this.router.navigate(['/login']);
      },
      error: () => {
        this.clearAuth();
        this.router.navigate(['/login']);
      },
    });
  }

  initializeAuth(): Observable<BenutzerInfo | null> {
    return this.fetchCurrentUser().pipe(
      catchError(() => of(null)),
    );
  }

  private fetchCurrentUser(): Observable<BenutzerInfo> {
    return this.api.get('/auth/me').pipe(
      tap((user) => this.currentUserSignal.set(user)),
      catchError((err) => {
        this.clearAuth();
        throw err;
      }),
    );
  }

  private clearAuth(): void {
    this.currentUserSignal.set(null);
  }
}
