// GENERATED — do not edit. Rebuild: cd backend && npm run api:generate

export interface paths {
    "/health": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Liveness probe
         * @description Public. Answers 200 while the process runs. The route lives inline in
         *     `app.ts`, not in a router file.
         */
        get: operations["getHealth"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/auth/login": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/auth/logout": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/auth/me": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/auth/test-login": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/firmen": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * List companies (paged)
         * @description Paged list without `adressen`. `search` matches `name`
         *     (case-insensitive substring).
         */
        get: operations["listFirmen"];
        put?: never;
        /**
         * Create a company
         * @description Answers the new record, read back with `adressen` (empty for a new company).
         */
        post: operations["createFirma"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/firmen/all": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * List all companies (not paged)
         * @description Every company without `adressen`, sorted by `name` ascending.
         */
        get: operations["listAllFirmen"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/firmen/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get one company
         * @description Includes `adressen`.
         */
        get: operations["getFirma"];
        /**
         * Update a company (full replace)
         * @description Overwrites every field. Optional fields left out are stored as null.
         *     Answers the record read back with `adressen`.
         */
        put: operations["updateFirma"];
        post?: never;
        /**
         * Delete a company
         * @description Cascades to its contacts, departments, addresses, activities and opportunities.
         */
        delete: operations["deleteFirma"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/firmen/{id}/personen": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * List the contacts of a company (paged)
         * @description Fixed order: `lastName`, then `firstName`, ascending. No `sort` and no
         *     `search`. An unknown company id answers an empty page, not 404.
         */
        get: operations["listFirmaPersonen"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/firmen/{id}/abteilungen": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * List the departments of a company (paged)
         * @description Fixed order: `name` ascending. No `sort` and no `search`. An unknown
         *     company id answers an empty page, not 404.
         */
        get: operations["listFirmaAbteilungen"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/personen": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/personen/all": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/personen/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/abteilungen": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/abteilungen/all": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/abteilungen/firma/{firmaId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/abteilungen/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/abteilungen/{id}/personen": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/adressen": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/adressen/all": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/adressen/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/aktivitaeten": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/aktivitaeten/all": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/aktivitaeten/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/chancen": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/chancen/all": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/chancen/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/dashboard": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/szenarien": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/szenarien/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/agent-tasks/next": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/agent-tasks/summary": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/agent-tasks/reset": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/agent-tasks/{id}/start": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/agent-tasks/{id}/reject": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/agent-tasks/{id}/done": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/agent-tasks/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/agent-tasks": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/tickets/next": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/tickets/board": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/tickets/summary": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/tickets/reset": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/tickets": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/tickets/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/tickets/{id}/status": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/tickets/{id}/owner": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/tickets/{id}/start": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/tickets/{id}/done": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/tickets/{id}/ask": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/tickets/{id}/wont-do": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/tickets/{id}/hand-to-ai": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/tickets/{id}/comments": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/cron/agent-tasks": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/cron/github-issues": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/cron/runs/{id}/complete": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/cron/runs": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/cron/jobs": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
}
export type webhooks = Record<string, never>;
export interface components {
    schemas: {
        /**
         * @description Every error answer (4xx and 5xx), built by `middleware/errorHandler.ts`.
         *     `fieldErrors` is empty except for input errors.
         */
        ErrorResponse: {
            /** @description HTTP status code, repeated in the body. */
            status: number;
            /** @description German top-level message, for example `Validierungsfehler` or `Firma mit ID 99 nicht gefunden`. */
            message: string;
            /** @description Server time, ISO-8601 with milliseconds and no `Z` suffix, for example `2026-04-15T10:30:00.123`. */
            timestamp: string;
            /** @description Field name (dot path inside the body, path parameter name, or `_` for the whole body) mapped to a German text. */
            fieldErrors: {
                [key: string]: string;
            };
        };
        /**
         * @description Paging fields of every page answer (Spring Data Page shape).
         *     Page schemas combine it with `allOf` and `unevaluatedProperties: false`.
         */
        PageMeta: {
            /** @description Number of rows across all pages. */
            totalElements: number;
            totalPages: number;
            /** @description Page size used for this answer. */
            size: number;
            /** @description Current page, 0-indexed. */
            number: number;
            first: boolean;
            last: boolean;
        };
        /**
         * @description An object with no declared properties. As a request body, extra fields
         *     are stripped and ignored. As an answer, the server sends `{}`.
         */
        EmptyObject: Record<string, never>;
        Health: {
            /** @constant */
            status: "ok";
            /** @description Server time, ISO-8601 UTC with `Z` (`new Date().toISOString()`). */
            timestamp: string;
            /** @description The `version` field of `backend/package.json`. */
            version: string;
        };
        LoginRequest: unknown;
        LoginResponse: unknown;
        BenutzerInfo: unknown;
        TestLoginRequest: unknown;
        Rolle: unknown;
        Permission: unknown;
        /**
         * @description A company. `adressen` appears only on single-record answers
         *     (get, create, update), never in lists.
         */
        Firma: {
            id: number;
            name: string;
            industry: string | null;
            website: string | null;
            phone: string | null;
            email: string | null;
            notes: string | null;
            /** @description Number of contacts of this company (computed, not stored). */
            personenCount: number;
            /** @description Number of departments of this company (computed, not stored). */
            abteilungenCount: number;
            /** @description Addresses of this company, sorted by `typ`, then `id`. Single-record answers only. */
            adressen?: components["schemas"]["FirmaAdresse"][];
            /** @description ISO-8601 text as stored. Seed rows use a space instead of `T`. */
            createdAt: string;
            /** @description ISO-8601 text as stored. Seed rows use a space instead of `T`. */
            updatedAt: string;
        };
        /**
         * @description Body for create and full update. Every field except `name` is optional.
         *     A left-out optional field is stored as null. Unknown fields are stripped.
         */
        FirmaInput: {
            name: string;
            industry?: string | null;
            website?: string | null;
            phone?: string | null;
            /** @description A valid email address, the empty string, or null. */
            email?: ((string | "" | null) | null) | string | "" | null;
            notes?: string | null;
        };
        /** @description Address summary inside a single company answer. */
        FirmaAdresse: {
            id: number;
            street: string | null;
            houseNumber: string | null;
            postalCode: string | null;
            city: string | null;
            country: string | null;
            latitude: number | null;
            longitude: number | null;
            /** @description Free text, for example `HAUPTQUARTIER` or `NIEDERLASSUNG`. */
            typ: string | null;
        };
        /** @description One page of companies (without `adressen`). */
        FirmaPage: components["schemas"]["PageMeta"] & {
            content: components["schemas"]["Firma"][];
        };
        Person: unknown;
        PersonInput: unknown;
        PersonPage: unknown;
        Abteilung: unknown;
        AbteilungInput: unknown;
        AbteilungPage: unknown;
        Adresse: unknown;
        AdresseInput: unknown;
        AdressePage: unknown;
        Aktivitaet: unknown;
        AktivitaetInput: unknown;
        AktivitaetPage: unknown;
        AktivitaetTyp: unknown;
        Chance: unknown;
        ChanceInput: unknown;
        ChancePage: unknown;
        ChancePhase: unknown;
        DashboardData: unknown;
        RecentChance: unknown;
        RecentAktivitaet: unknown;
        Szenario: unknown;
        SzenarioInput: unknown;
        ProzessDauer: unknown;
        AgentTask: unknown;
        AgentTaskPage: unknown;
        AgentTaskSummary: unknown;
        AgentTaskSource: unknown;
        AgentTaskStatus: unknown;
        AgentTaskRejectInput: unknown;
        AgentTaskDoneInput: unknown;
        AgentTaskResetResult: unknown;
        CronRun: unknown;
        CronRunPage: unknown;
        CronJob: unknown;
        CronJobLastRun: unknown;
        CronRunStatus: unknown;
        CronTrigger: unknown;
        CronRunCompleteInput: unknown;
        TicketDetail: unknown;
        TicketListItem: unknown;
        TicketListItemPage: unknown;
        TicketBoard: unknown;
        TicketSummary: unknown;
        TicketComment: unknown;
        TicketCreateInput: unknown;
        TicketStatusInput: unknown;
        TicketOwnerInput: unknown;
        TicketAskInput: unknown;
        TicketDoneInput: unknown;
        TicketWontDoInput: unknown;
        TicketCommentInput: unknown;
        TicketResetResult: unknown;
        TicketOwner: unknown;
        TicketType: unknown;
        TicketStatus: unknown;
        TicketSolution: unknown;
        TicketCommentAuthor: unknown;
    };
    responses: {
        /** @description Invalid input. `message` names the problem; `fieldErrors` maps fields to German texts. */
        BadRequest: {
            headers: {
                [name: string]: unknown;
            };
            content: {
                "application/json": components["schemas"]["ErrorResponse"];
            };
        };
        /** @description Not authenticated (no session, or a missing or wrong token). */
        Unauthorized: {
            headers: {
                [name: string]: unknown;
            };
            content: {
                "application/json": components["schemas"]["ErrorResponse"];
            };
        };
        /** @description Authenticated, but the role is not allowed (`Zugriff verweigert`). */
        Forbidden: {
            headers: {
                [name: string]: unknown;
            };
            content: {
                "application/json": components["schemas"]["ErrorResponse"];
            };
        };
        /** @description Record not found. */
        NotFound: {
            headers: {
                [name: string]: unknown;
            };
            content: {
                "application/json": components["schemas"]["ErrorResponse"];
            };
        };
        /** @description Conflict with the current data, for example a duplicate name or an invalid state change. */
        Conflict: {
            headers: {
                [name: string]: unknown;
            };
            content: {
                "application/json": components["schemas"]["ErrorResponse"];
            };
        };
    };
    parameters: {
        /** @description Record id, a positive whole number without sign or leading zeros. */
        IdPath: string;
        /** @description Company id, a positive whole number without sign or leading zeros. */
        FirmaIdPath: string;
        /** @description Page number, 0-indexed. A missing, negative or non-numeric value falls back to 0. */
        PageQuery: number;
        /** @description Page size. Default 10. Values above 200 are capped at 200. A missing, non-positive or non-numeric value falls back to 10. */
        SizeQuery: number;
        /**
         * @description field,direction; direction in any case (asc/ASC/desc/DESC).
         *     The allowed fields are the operation's `x-sort-fields`; the default is its
         *     `x-default-sort`. An unknown field answers 400 with the message
         *     `Ungültiges Sortierfeld: <field>`. A missing or unknown direction falls
         *     back to the default direction.
         */
        SortQuery: string;
        /** @description Case-insensitive substring filter. The operation description names the matched field. */
        SearchQuery: string;
    };
    requestBodies: never;
    headers: never;
    pathItems: never;
}
export type $defs = Record<string, never>;
export interface operations {
    getHealth: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Service is up. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Health"];
                };
            };
        };
    };
    listFirmen: {
        parameters: {
            query?: {
                /** @description Case-insensitive substring filter. The operation description names the matched field. */
                search?: components["parameters"]["SearchQuery"];
                /** @description Page number, 0-indexed. A missing, negative or non-numeric value falls back to 0. */
                page?: components["parameters"]["PageQuery"];
                /** @description Page size. Default 10. Values above 200 are capped at 200. A missing, non-positive or non-numeric value falls back to 10. */
                size?: components["parameters"]["SizeQuery"];
                /**
                 * @description field,direction; direction in any case (asc/ASC/desc/DESC).
                 *     The allowed fields are the operation's `x-sort-fields`; the default is its
                 *     `x-default-sort`. An unknown field answers 400 with the message
                 *     `Ungültiges Sortierfeld: <field>`. A missing or unknown direction falls
                 *     back to the default direction.
                 */
                sort?: components["parameters"]["SortQuery"];
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description One page of companies. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["FirmaPage"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
        };
    };
    createFirma: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["FirmaInput"];
            };
        };
        responses: {
            /** @description Created. */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Firma"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
        };
    };
    listAllFirmen: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description All companies. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Firma"][];
                };
            };
            401: components["responses"]["Unauthorized"];
        };
    };
    getFirma: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description Record id, a positive whole number without sign or leading zeros. */
                id: components["parameters"]["IdPath"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description The company. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Firma"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            404: components["responses"]["NotFound"];
        };
    };
    updateFirma: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description Record id, a positive whole number without sign or leading zeros. */
                id: components["parameters"]["IdPath"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["FirmaInput"];
            };
        };
        responses: {
            /** @description Updated. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Firma"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            404: components["responses"]["NotFound"];
        };
    };
    deleteFirma: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description Record id, a positive whole number without sign or leading zeros. */
                id: components["parameters"]["IdPath"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Deleted. No body. */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            404: components["responses"]["NotFound"];
        };
    };
    listFirmaPersonen: {
        parameters: {
            query?: {
                /** @description Page number, 0-indexed. A missing, negative or non-numeric value falls back to 0. */
                page?: components["parameters"]["PageQuery"];
                /** @description Page size. Default 10. Values above 200 are capped at 200. A missing, non-positive or non-numeric value falls back to 10. */
                size?: components["parameters"]["SizeQuery"];
            };
            header?: never;
            path: {
                /** @description Record id, a positive whole number without sign or leading zeros. */
                id: components["parameters"]["IdPath"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description One page of contacts. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PersonPage"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
        };
    };
    listFirmaAbteilungen: {
        parameters: {
            query?: {
                /** @description Page number, 0-indexed. A missing, negative or non-numeric value falls back to 0. */
                page?: components["parameters"]["PageQuery"];
                /** @description Page size. Default 10. Values above 200 are capped at 200. A missing, non-positive or non-numeric value falls back to 10. */
                size?: components["parameters"]["SizeQuery"];
            };
            header?: never;
            path: {
                /** @description Record id, a positive whole number without sign or leading zeros. */
                id: components["parameters"]["IdPath"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description One page of departments. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AbteilungPage"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
        };
    };
}
