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
        /**
         * Log in with user name and password
         * @description Starts a new session (the old session id is replaced) and sets the
         *     cookie `JSESSIONID` (httpOnly). Missing, empty or unknown credentials
         *     answer 401 `Ungültige Anmeldedaten`. The contract does not validate the
         *     body.
         */
        post: operations["login"];
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
        /**
         * Log out
         * @description Destroys the session and clears the cookie `JSESSIONID`. Always answers
         *     200 `{}`, also without a session.
         */
        post: operations["logout"];
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
        /** Get the session user */
        get: operations["getCurrentUser"];
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
        /**
         * Log in by user name only (test helper)
         * @description Exists only in development and test. In production the route answers 404
         *     `{status, message}`. No password check. A missing `benutzername` answers
         *     401 `benutzername required`; an unknown user answers 401
         *     `Benutzer nicht gefunden`. Sets the cookie `JSESSIONID`. The contract does
         *     not validate the body.
         */
        post: operations["testLogin"];
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
        /**
         * List contacts (paged)
         * @description `search` matches `firstName` or `lastName` (case-insensitive substring).
         *     `abteilungId` filters by department. It is lenient: a missing, non-numeric
         *     or non-positive value is ignored.
         */
        get: operations["listPersonen"];
        put?: never;
        /**
         * Create a contact
         * @description Answers the new record as read back from the database.
         */
        post: operations["createPerson"];
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
        /**
         * List all contacts (not paged)
         * @description Sorted by `lastName`, then `firstName`, ascending. The optional
         *     `abteilungId` filter is lenient: a missing, non-numeric or non-positive
         *     value is ignored.
         */
        get: operations["listAllPersonen"];
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
        /** Get one contact */
        get: operations["getPerson"];
        /**
         * Update contact (full replace)
         * @description Overwrites every field. Optional fields left out are stored as null, including `abteilungId`.
         *     Answers the record as read back from the database.
         */
        put: operations["updatePerson"];
        post?: never;
        /**
         * Delete contact
         * @description Cascades to the contact's addresses and activities. Opportunities that name the contact lose that link (`kontaktPersonId` becomes null).
         */
        delete: operations["deletePerson"];
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
        /**
         * List departments (paged)
         * @description No `search`.
         */
        get: operations["listAbteilungen"];
        put?: never;
        /**
         * Create a department
         * @description Answers the new record as read back from the database.
         */
        post: operations["createAbteilung"];
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
        /**
         * List all departments (not paged)
         * @description Sorted by `name` ascending.
         */
        get: operations["listAllAbteilungen"];
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
        /**
         * List the departments of a company (not paged)
         * @description A plain array sorted by `name` ascending. An unknown company id answers
         *     an empty array, not 404.
         */
        get: operations["listAbteilungenByFirma"];
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
        /** Get one department */
        get: operations["getAbteilung"];
        /**
         * Update department (full replace)
         * @description Overwrites every field. Optional fields left out are stored as null.
         *     Answers the record as read back from the database.
         */
        put: operations["updateAbteilung"];
        post?: never;
        /**
         * Delete department
         * @description Contacts of the department stay; their `abteilungId` becomes null.
         */
        delete: operations["deleteAbteilung"];
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
        /**
         * List the contacts of a department (paged)
         * @description Fixed order: `lastName`, then `firstName`, ascending. No `sort` and no
         *     `search`. An unknown department id answers 404.
         */
        get: operations["listAbteilungPersonen"];
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
        /**
         * List addresses (paged)
         * @description `search` matches `city` (case-insensitive substring).
         */
        get: operations["listAdressen"];
        put?: never;
        /**
         * Create an address
         * @description Answers the new record as read back from the database.
         */
        post: operations["createAdresse"];
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
        /**
         * List all addresses (not paged)
         * @description Sorted by `city` ascending.
         */
        get: operations["listAllAdressen"];
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
        /** Get one address */
        get: operations["getAdresse"];
        /**
         * Update address (full replace)
         * @description Overwrites every field. Optional fields left out are stored as null, except `latitude` and `longitude`: a left-out value keeps the current one (an explicit null clears it).
         *     Answers the record as read back from the database.
         */
        put: operations["updateAdresse"];
        post?: never;
        /**
         * Delete address
         * @description Deletes the single address only.
         */
        delete: operations["deleteAdresse"];
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
        /**
         * List activities (paged)
         * @description Paged list. No `search` filter.
         */
        get: operations["listAktivitaeten"];
        put?: never;
        /** Create an activity */
        post: operations["createAktivitaet"];
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
        /**
         * List all activities (not paged)
         * @description Every activity, sorted by `datum` descending.
         */
        get: operations["listAllAktivitaeten"];
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
        /** Get one activity */
        get: operations["getAktivitaet"];
        /**
         * Update an activity (full replace)
         * @description Overwrites every field. Optional fields left out are stored as null (or reset to their default).
         */
        put: operations["updateAktivitaet"];
        post?: never;
        /** Delete an activity */
        delete: operations["deleteAktivitaet"];
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
        /**
         * List opportunities (paged)
         * @description Paged list. `search` matches `titel` (case-insensitive substring, trimmed).
         *     If `search` is repeated, only the first value counts. `phase` filters by exact phase.
         */
        get: operations["listChancen"];
        put?: never;
        /** Create an opportunity */
        post: operations["createChance"];
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
        /**
         * List all opportunities (not paged)
         * @description Every opportunity, sorted by `createdAt` descending.
         */
        get: operations["listAllChancen"];
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
        /** Get one opportunity */
        get: operations["getChance"];
        /**
         * Update an opportunity (full replace)
         * @description Overwrites every field. Optional fields left out are stored as null (or reset to their default).
         */
        put: operations["updateChance"];
        post?: never;
        /** Delete an opportunity */
        delete: operations["deleteChance"];
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
        /**
         * Get the dashboard data
         * @description Counters plus the 5 newest opportunities and activities. The whole
         *     router is guarded with `router.use(requireAuth)`.
         */
        get: operations["getDashboard"];
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
        /**
         * List scenarios
         * @description Plain array (not paged), newest `createdAt` first.
         */
        get: operations["listSzenarien"];
        put?: never;
        /** Create a scenario */
        post: operations["createSzenario"];
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
        /** Get one scenario */
        get: operations["getSzenario"];
        /** Update a scenario (full replace) */
        put: operations["updateSzenario"];
        post?: never;
        /** Delete a scenario */
        delete: operations["deleteSzenario"];
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
        /**
         * Claim the oldest open task of a source
         * @description Sets the oldest `OPEN` task of `source` to `IN_PROGRESS` and answers it.
         *     `source` is required and checked in code (400 when missing or not an
         *     enum value). Answers 204 without body when no task is open.
         *     A wrong agent token never falls through to a session: it answers 401. Needs `AGENT_API_TOKEN` to be configured, also for the loopback bypass.
         */
        get: operations["claimNextAgentTask"];
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
        /**
         * Count tasks per source and status
         * @description One entry per source. All four sources always appear.
         */
        get: operations["getAgentTaskSummary"];
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
        /**
         * Set every task back to OPEN
         * @description Clears `comment`, `pickedUpAt` and `resolvedAt` on all rows. The body is optional and ignored.
         */
        post: operations["resetAgentTasks"];
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
        /**
         * Start a task
         * @description `OPEN` → `IN_PROGRESS`. Answers 409 when the task is not `OPEN`. The body is optional and ignored.
         *     A wrong agent token never falls through to a session: it answers 401.
         */
        post: operations["startAgentTask"];
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
        /**
         * Reject a task
         * @description Sets `REJECTED` with the comment. Answers 409 when the task is already `DONE` or `REJECTED`.
         *     A wrong agent token never falls through to a session: it answers 401.
         */
        post: operations["rejectAgentTask"];
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
        /**
         * Mark a task as done
         * @description Sets `DONE` with an optional comment. Answers 409 when the task is already `DONE` or `REJECTED`.
         *     A wrong agent token never falls through to a session: it answers 401.
         */
        post: operations["completeAgentTask"];
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
        /**
         * Get one task
         * @description Agent token, loopback bypass or admin session. A non-admin session answers 403.
         *     A wrong agent token never falls through to a session: it answers 401.
         */
        get: operations["getAgentTask"];
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
        /**
         * List tasks (paged)
         * @description Optional filters `source` and `status`. A value outside the enum answers 400.
         */
        get: operations["listAgentTasks"];
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
        /**
         * Claim the next ticket
         * @description Atomic claim: the oldest `TODO` + `AI` ticket becomes `IN_PROGRESS` (sets `pickedUpAt`).
         *     Optional `type` filter. Answers 204 when no ticket matches.
         *     Agent token or loopback only. A session cookie is not accepted, because this GET changes state (CSRF).
         *     A wrong agent token answers 401 and never falls through to a session.
         */
        get: operations["claimNextTicket"];
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
        /**
         * Get the Kanban board
         * @description Five columns, each an array of list items (with `commentCount`), oldest first.
         *     Any logged-in session (no admin needed) or an agent token.
         *     A wrong agent token answers 401 and never falls through to a session.
         */
        get: operations["getTicketBoard"];
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
        /**
         * Get ticket counts
         * @description Counts by status, type, owner and solution. Any logged-in session. Agent tokens are not accepted.
         */
        get: operations["getTicketSummary"];
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
        /**
         * Reset to the workshop tickets
         * @description Deletes all tickets and comments, then re-seeds the workshop tickets. Admin session only.
         */
        post: operations["resetTickets"];
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
        /**
         * List tickets (paged)
         * @description Paged list of list items (with `commentCount`). Admin session only.
         *     Filters `type`, `status`, `owner`: an unknown value answers 400 (`Ungültiger Ticket-Typ: <value>`, `Ungültiger Status: <value>`, `Ungültiger Eigentümer: <value>`).
         */
        get: operations["listTickets"];
        put?: never;
        /**
         * Create a ticket
         * @description New ticket starts as `owner=HUMAN`, `status=DEFINITION`, without comments.
         *     An unknown `agentTaskId` answers 400 with a field error on `agentTaskId`.
         *     Agent token, loopback or admin session.
         */
        post: operations["createTicket"];
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
        /**
         * Get one ticket
         * @description Ticket with comments. Any logged-in session (no admin needed) or an agent token.
         */
        get: operations["getTicket"];
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
        /**
         * Set the status
         * @description Moves the ticket to any column. Into `DONE` sets `solution=DONE` and `resolvedAt`. Out of `DONE` clears both. Owner never changes.
         *     Agent token, loopback or admin session.
         */
        patch: operations["setTicketStatus"];
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
        /**
         * Set the owner
         * @description Changes the owner only. `AI` keeps the ticket in `DEFINITION`. Agent token, loopback or admin session.
         */
        patch: operations["setTicketOwner"];
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
        /**
         * Start a specific ticket
         * @description Claims by id: `TODO` + `AI` becomes `IN_PROGRESS`. Any other state answers 409.
         *     Agent token, loopback or admin session.
         */
        post: operations["startTicket"];
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
        /**
         * Finish a ticket
         * @description `IN_PROGRESS` becomes `DONE` with `solution=DONE`. Any other state answers 409.
         *     An optional `comment` is stored as an `AGENT` comment. Agent token, loopback or admin session.
         */
        post: operations["completeTicket"];
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
        /**
         * Ask a question
         * @description `IN_PROGRESS` becomes `ON_HOLD`, owner `HUMAN`. Any other state answers 409.
         *     The question is stored as an `AGENT` comment. Agent token, loopback or admin session.
         */
        post: operations["askTicketQuestion"];
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
        /**
         * Mark as Won't Do
         * @description Resolves a ticket with `solution=WONT_DO`. Only allowed when the status is not `DONE` and the owner is `HUMAN`, else 409.
         *     An optional `comment` is stored as a `HUMAN` comment. Admin session only.
         */
        post: operations["markTicketWontDo"];
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
        /**
         * Hand a ticket to the AI
         * @description Only from `DEFINITION`, else 409. Sets owner `AI` and status `TODO`. Admin session only.
         */
        post: operations["handTicketToAi"];
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
        /**
         * Add a comment
         * @description Appends a comment, author defaults to `HUMAN`. `handBackToAi` needs an `ON_HOLD` + `HUMAN` ticket, else 409.
         *     Answers 403 when `author=AGENT` comes with an authenticated session cookie, also on loopback. Only an agent token or loopback without a session may post as `AGENT`.
         *     Agent token, loopback or admin session.
         */
        post: operations["addTicketComment"];
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
        /**
         * Trigger the agent-task runner
         * @description Job `solve-tasks`. Skips when a run is already `RUNNING` or no agent task is `OPEN`.
         *     Auth: `CRON_SECRET` bearer or admin session. A wrong `CRON_SECRET` falls
         *     through to the session check. A non-admin session answers 401, not 403.
         *     Always answers 200 with the run, also when the run was skipped or the
         *     GitHub dispatch failed (then `status` is `SKIPPED` or `FAILED`).
         */
        get: operations["triggerAgentTasksRun"];
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
        /**
         * Trigger the GitHub-issue agent
         * @description Job `solve-github-issues`. Skips when a run is already `RUNNING`.
         *     Auth: `CRON_SECRET` bearer or admin session. A wrong `CRON_SECRET` falls
         *     through to the session check. A non-admin session answers 401, not 403.
         *     Always answers 200 with the run, also when the run was skipped or the
         *     GitHub dispatch failed (then `status` is `SKIPPED` or `FAILED`).
         */
        get: operations["triggerGithubIssuesRun"];
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
        /**
         * Report the result of a run
         * @description Called by the GitHub workflow when it finishes. Sets status, counts and run URL.
         *     A wrong agent token never falls through to a session: it answers 401.
         */
        post: operations["completeCronRun"];
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
        /**
         * List cron runs (paged)
         * @description Optional exact-match `job` filter. An empty `job` means no filter.
         */
        get: operations["listCronRuns"];
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
        /**
         * List configured cron jobs
         * @description Every job with its newest run. `lastRun` is null when it never ran.
         */
        get: operations["listCronJobs"];
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
        /**
         * @description Credentials. Both fields are optional in the contract: the route is not
         *     validated by the contract (`x-skip-request-validation`). A missing or empty
         *     field answers 401 `Ungültige Anmeldedaten`, not 400.
         */
        LoginRequest: {
            benutzername?: string;
            passwort?: string;
        };
        /** @description The logged-in user (short form). The session id travels in the `Set-Cookie` header. */
        LoginResponse: {
            benutzername: string;
            vorname: string;
            nachname: string;
            rollen: components["schemas"]["Rolle"][];
        };
        /** @description The session user (long form) for `GET /auth/me`. */
        BenutzerInfo: {
            id: number;
            benutzername: string;
            vorname: string;
            nachname: string;
            /** @description Not stored. Built as `<benutzername>@crm.local`. */
            email: string;
            rollen: components["schemas"]["Rolle"][];
            /** @description Listed on the user but not enforced by any middleware. */
            permissions: components["schemas"]["Permission"][];
        };
        /**
         * @description Test login by name only, no password. A missing or empty `benutzername`
         *     answers 401 `benutzername required`.
         */
        TestLoginRequest: {
            benutzername?: string;
        };
        /**
         * @description Role, the name from `users.ts` with the prefix `ROLE_`.
         * @enum {string}
         */
        Rolle: "ROLE_ADMIN" | "ROLE_USER";
        /**
         * @description Permission on a user. Informational only.
         * @enum {string}
         */
        Permission: "FIRMEN" | "PERSONEN" | "ABTEILUNGEN" | "ADRESSEN" | "AKTIVITAETEN" | "CHANCEN" | "BENUTZERVERWALTUNG";
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
        /** @description A contact person. `firmaName` and `abteilungName` come from a join. */
        Person: {
            id: number;
            firstName: string;
            lastName: string;
            email: string | null;
            phone: string | null;
            position: string | null;
            notes: string | null;
            firmaId: number;
            firmaName: string | null;
            abteilungId: number | null;
            abteilungName: string | null;
            /** @description ISO-8601 text as stored. Seed rows use a space instead of `T`. */
            createdAt: string;
            /** @description ISO-8601 text as stored. Seed rows use a space instead of `T`. */
            updatedAt: string;
        };
        /**
         * @description Body for create and full update. Required: `firstName`, `lastName`, `firmaId`.
         *     A left-out optional field is stored as null. Unknown fields are stripped.
         */
        PersonInput: {
            firstName: string;
            lastName: string;
            /** @description A valid email address, the empty string, or null. */
            email?: ((string | "" | null) | null) | string | "" | null;
            phone?: string | null;
            position?: string | null;
            notes?: string | null;
            firmaId: number;
            abteilungId?: number | null;
        };
        /** @description One page of contacts. */
        PersonPage: components["schemas"]["PageMeta"] & {
            content: components["schemas"]["Person"][];
        };
        /** @description A department. `firmaName` comes from a join; `personenCount` is computed. */
        Abteilung: {
            id: number;
            name: string;
            description: string | null;
            firmaId: number;
            firmaName: string | null;
            /** @description Number of contacts in this department (computed, not stored). */
            personenCount: number;
            /** @description ISO-8601 text as stored. Seed rows use a space instead of `T`. */
            createdAt: string;
            /** @description ISO-8601 text as stored. Seed rows use a space instead of `T`. */
            updatedAt: string;
        };
        /**
         * @description Body for create and full update. Required: `name`, `firmaId`.
         *     A left-out `description` is stored as null. Unknown fields are stripped.
         */
        AbteilungInput: {
            name: string;
            description?: string | null;
            firmaId: number;
        };
        /** @description One page of departments. */
        AbteilungPage: components["schemas"]["PageMeta"] & {
            content: components["schemas"]["Abteilung"][];
        };
        /**
         * @description An address, linked to a company, a person, both or neither.
         *     `firmaName` and `personName` come from joins.
         */
        Adresse: {
            id: number;
            street: string | null;
            houseNumber: string | null;
            postalCode: string | null;
            city: string | null;
            country: string | null;
            /** @description Free text, for example `HAUPTQUARTIER` or `NIEDERLASSUNG`. */
            typ: string | null;
            firmaId: number | null;
            firmaName: string | null;
            personId: number | null;
            /** @description `firstName lastName`; only one part if the other is empty; null without person. */
            personName: string | null;
            latitude: number | null;
            longitude: number | null;
            /** @description ISO-8601 text as stored. Seed rows use a space instead of `T`. */
            createdAt: string;
            /** @description ISO-8601 text as stored. Seed rows use a space instead of `T`. */
            updatedAt: string;
        };
        /**
         * @description Body for create and full update. Every field is optional.
         *     On update, a left-out text or id field is stored as null, but a left-out
         *     `latitude` or `longitude` keeps its current value (an explicit null clears it).
         *     Unknown fields are stripped.
         */
        AdresseInput: {
            street?: string | null;
            houseNumber?: string | null;
            postalCode?: string | null;
            city?: string | null;
            country?: string | null;
            typ?: string | null;
            firmaId?: number | null;
            personId?: number | null;
            latitude?: number | null;
            longitude?: number | null;
        };
        /** @description One page of addresses. */
        AdressePage: components["schemas"]["PageMeta"] & {
            content: components["schemas"]["Adresse"][];
        };
        /** @description An activity (call, email, meeting, note, task), optionally linked to a company and a contact. */
        Aktivitaet: {
            id: number;
            typ: components["schemas"]["AktivitaetTyp"];
            subject: string;
            description: string | null;
            /** @description Free text as sent by the client (no format enforced). */
            datum: string;
            firmaId: number | null;
            firmaName: string | null;
            personId: number | null;
            /** @description `firstName lastName`; only one part if the other is empty; null without contact. */
            personName: string | null;
            /** @description ISO-8601 text as stored. Seed rows use a space instead of `T`. */
            createdAt: string;
            /** @description ISO-8601 text as stored. Seed rows use a space instead of `T`. */
            updatedAt: string;
        };
        /**
         * @description Body for create and full update. `typ`, `subject` and `datum` are required.
         *     A left-out optional field is stored as null. Unknown fields are stripped.
         */
        AktivitaetInput: {
            /**
             * @description Same values as `AktivitaetTyp`. Inline so the error texts sit next to `enum`.
             * @enum {string}
             */
            typ: "ANRUF" | "EMAIL" | "MEETING" | "NOTIZ" | "AUFGABE";
            subject: string;
            description?: string | null;
            datum: string;
            firmaId?: number | null;
            personId?: number | null;
        };
        /** @description One page of activities. */
        AktivitaetPage: components["schemas"]["PageMeta"] & {
            content: components["schemas"]["Aktivitaet"][];
        };
        /** @enum {string} */
        AktivitaetTyp: "ANRUF" | "EMAIL" | "MEETING" | "NOTIZ" | "AUFGABE";
        /** @description A sales opportunity of a company, optionally with a contact. */
        Chance: {
            id: number;
            titel: string;
            beschreibung: string | null;
            wert: number | null;
            /** @description Default `EUR`. */
            currency: string;
            phase: components["schemas"]["ChancePhase"];
            /** @description Percent, 0 to 100. */
            wahrscheinlichkeit: number | null;
            /** @description Free text as sent by the client (no format enforced). */
            erwartetesDatum: string | null;
            firmaId: number;
            firmaName: string | null;
            kontaktPersonId: number | null;
            /** @description `firstName lastName`; only one part if the other is empty; null without contact. */
            kontaktPersonName: string | null;
            /** @description ISO-8601 text as stored. Seed rows use a space instead of `T`. */
            createdAt: string;
            /** @description ISO-8601 text as stored. Seed rows use a space instead of `T`. */
            updatedAt: string;
        };
        /**
         * @description Body for create and full update. `titel` and `firmaId` are required.
         *     Left out: `phase` becomes `NEU`, `currency` becomes `EUR`, other optional
         *     fields are stored as null. Unknown fields are stripped.
         */
        ChanceInput: {
            titel: string;
            beschreibung?: string | null;
            wert?: number | null;
            /** @description Optional, not nullable. Default `EUR`. */
            currency?: string;
            /**
             * @description Optional, not nullable. Default `NEU`. Same values as `ChancePhase`, inline so the error texts sit next to `enum`.
             * @enum {string}
             */
            phase?: "NEU" | "QUALIFIZIERT" | "ANGEBOT" | "VERHANDLUNG" | "GEWONNEN" | "VERLOREN";
            wahrscheinlichkeit?: number | null;
            erwartetesDatum?: string | null;
            firmaId: number;
            kontaktPersonId?: number | null;
        };
        /** @description One page of opportunities. */
        ChancePage: components["schemas"]["PageMeta"] & {
            content: components["schemas"]["Chance"][];
        };
        /** @enum {string} */
        ChancePhase: "NEU" | "QUALIFIZIERT" | "ANGEBOT" | "VERHANDLUNG" | "GEWONNEN" | "VERLOREN";
        /** @description Counters and the latest records for the start page. */
        DashboardData: {
            /** @description Number of companies. */
            firmenCount: number;
            /** @description Number of contacts. */
            personenCount: number;
            /** @description Number of opportunities not in phase `GEWONNEN` or `VERLOREN`. */
            offeneChancenCount: number;
            /** @description Sum of `wert` over all opportunities in phase `GEWONNEN`. 0 if none. Mixed currencies are added as is. */
            gewonneneChancenSumme: number;
            /** @description The 5 newest opportunities by `createdAt`, newest first. */
            recentChancen: components["schemas"]["RecentChance"][];
            /** @description The 5 newest activities by `createdAt`, newest first. */
            recentAktivitaeten: components["schemas"]["RecentAktivitaet"][];
        };
        /** @description Short opportunity entry on the dashboard. */
        RecentChance: {
            id: number;
            titel: string;
            wert: number | null;
            currency: string;
            phase: components["schemas"]["ChancePhase"];
            firmaName: string;
            /** @description ISO-8601 text as stored. Seed rows use a space instead of `T`. */
            createdAt: string;
        };
        /** @description Short activity entry on the dashboard. */
        RecentAktivitaet: {
            id: number;
            typ: components["schemas"]["AktivitaetTyp"];
            subject: string;
            datum: string;
            firmaName: string | null;
            /** @description `firstName lastName` of the linked contact, null without contact. */
            personName: string | null;
            /** @description ISO-8601 text as stored. Seed rows use a space instead of `T`. */
            createdAt: string;
        };
        /** @description A process scenario. Durations are whole minutes. */
        Szenario: {
            id: number;
            name: string;
            humanSteps: components["schemas"]["ProzessDauer"];
            agileKiSteps: components["schemas"]["ProzessDauer"];
            semiAutomatedSteps: components["schemas"]["ProzessDauer"];
            automatedSteps: components["schemas"]["ProzessDauer"];
            /** @description ISO-8601 text as stored. */
            createdAt: string;
            /** @description ISO-8601 text as stored. */
            updatedAt: string;
        };
        /**
         * @description Create or replace a scenario. `name` must be unique (409 otherwise).
         *     Each process needs exactly N work durations and N-1 wait durations.
         *     Durations are whole minutes from 0 to 479520 (999 days).
         */
        SzenarioInput: {
            name: string;
            /** @description Human process. 19 works, 18 waits. */
            humanSteps: {
                works: number[];
                waits: number[];
            };
            /** @description Agile KI process. 19 works, 18 waits. */
            agileKiSteps: {
                works: number[];
                waits: number[];
            };
            /** @description Semi-automated process. 11 works, 10 waits. */
            semiAutomatedSteps: {
                works: number[];
                waits: number[];
            };
            /** @description Automated process. 2 works, 1 waits. */
            automatedSteps: {
                works: number[];
                waits: number[];
            };
        };
        /** @description Work and wait durations (minutes) of one process. Stored as JSON text, sent as arrays. */
        ProzessDauer: {
            works: number[];
            waits: number[];
        };
        AgentTask: {
            id: number;
            source: components["schemas"]["AgentTaskSource"];
            title: string;
            body: string;
            status: components["schemas"]["AgentTaskStatus"];
            /** @description Agent comment from `done` or `reject`. */
            comment: string | null;
            /** @description Free text, usually a JSON string. */
            metadata: string | null;
            /** @description ISO-8601 time of the claim or start. */
            pickedUpAt: string | null;
            /** @description ISO-8601 time of `done` or `reject`. */
            resolvedAt: string | null;
            /** @description ISO-8601 time. */
            createdAt: string;
            /** @description ISO-8601 time. */
            updatedAt: string;
            /** @description Id of the newest ticket that links to this task, or null. */
            ticketId: number | null;
        };
        AgentTaskPage: components["schemas"]["PageMeta"] & {
            content: components["schemas"]["AgentTask"][];
        };
        /** @description Counts per source. All four sources always appear, zero-filled. */
        AgentTaskSummary: {
            source: components["schemas"]["AgentTaskSource"];
            openCount: number;
            inProgressCount: number;
            doneCount: number;
            rejectedCount: number;
        };
        /**
         * @description Where the task came from.
         * @enum {string}
         */
        AgentTaskSource: "EMAIL" | "GITHUB_ISSUE" | "APP_LOG" | "ERROR_REPORT";
        /**
         * @description Lifecycle `OPEN` → `IN_PROGRESS` → `DONE` or `REJECTED`.
         * @enum {string}
         */
        AgentTaskStatus: "OPEN" | "IN_PROGRESS" | "DONE" | "REJECTED";
        AgentTaskRejectInput: {
            comment: string;
        };
        AgentTaskDoneInput: {
            comment?: string;
        };
        AgentTaskResetResult: {
            /** @description Number of rows set back to `OPEN`. */
            reset: number;
        };
        CronRun: {
            id: number;
            /** @description Job name, for example `solve-tasks`. */
            job: string;
            status: components["schemas"]["CronRunStatus"];
            trigger: components["schemas"]["CronTrigger"];
            /** @description ISO-8601 time. */
            startedAt: string;
            /** @description ISO-8601 time. */
            finishedAt: string | null;
            durationMs: number | null;
            /** @description JSON string, `{"skipReason":...}` or `{"tasksSolved":...,"tasksRejected":...}`. */
            result: string | null;
            githubRunUrl: string | null;
            error: string | null;
        };
        CronRunPage: components["schemas"]["PageMeta"] & {
            content: components["schemas"]["CronRun"][];
        };
        CronJob: {
            name: string;
            /** @description Cron expression, or `manuell`. */
            schedule: string;
            description: string;
            /** @description GitHub `repository_dispatch` event type. */
            dispatchEventType: string;
            lastRun: components["schemas"]["CronJobLastRun"];
        };
        /** @description Newest run of the job, or null when it never ran. Same fields as `CronRun`. */
        CronJobLastRun: {
            id: number;
            job: string;
            status: components["schemas"]["CronRunStatus"];
            trigger: components["schemas"]["CronTrigger"];
            startedAt: string;
            finishedAt: string | null;
            durationMs: number | null;
            result: string | null;
            githubRunUrl: string | null;
            error: string | null;
        } | null;
        /** @enum {string} */
        CronRunStatus: "RUNNING" | "SUCCESS" | "FAILED" | "SKIPPED";
        /**
         * @description `CRON` for the `CRON_SECRET` bearer, `MANUAL` for an admin session.
         * @enum {string}
         */
        CronTrigger: "CRON" | "MANUAL";
        CronRunCompleteInput: {
            /** @enum {string} */
            status: "SUCCESS" | "FAILED";
            tasksSolved: number;
            tasksRejected: number;
            /** Format: uri */
            githubRunUrl: string;
        };
        /** @description A ticket with its full comment thread (oldest first). Single-ticket answers. */
        TicketDetail: {
            id: number;
            owner: components["schemas"]["TicketOwner"];
            type: components["schemas"]["TicketType"];
            title: string;
            body: string;
            status: components["schemas"]["TicketStatus"];
            /**
             * @description Set when the ticket is resolved (`DONE` column), else null.
             * @enum {string|null}
             */
            solution: "DONE" | "WONT_DO" | null;
            /** @description ISO-8601 text. Set when an agent claims the ticket. */
            pickedUpAt: string | null;
            /** @description ISO-8601 text. Set when the ticket is resolved. */
            resolvedAt: string | null;
            createdAt: string;
            updatedAt: string;
            /** @description Marker "ready to build without further human input". Stored as 0/1. */
            fullyReady: boolean;
            /** @description Linked agent task (feedback item) that spawned the ticket. */
            agentTaskId: number | null;
            comments: components["schemas"]["TicketComment"][];
        };
        /** @description A ticket in a list or board column. No comments, only their count. */
        TicketListItem: {
            id: number;
            owner: components["schemas"]["TicketOwner"];
            type: components["schemas"]["TicketType"];
            title: string;
            body: string;
            status: components["schemas"]["TicketStatus"];
            /**
             * @description Set when the ticket is resolved (`DONE` column), else null.
             * @enum {string|null}
             */
            solution: "DONE" | "WONT_DO" | null;
            pickedUpAt: string | null;
            resolvedAt: string | null;
            createdAt: string;
            updatedAt: string;
            fullyReady: boolean;
            agentTaskId: number | null;
            commentCount: number;
        };
        TicketListItemPage: components["schemas"]["PageMeta"] & {
            content: components["schemas"]["TicketListItem"][];
        };
        /** @description Tickets grouped by status, each column oldest first (`createdAt` ascending). */
        TicketBoard: {
            DEFINITION: components["schemas"]["TicketListItem"][];
            TODO: components["schemas"]["TicketListItem"][];
            IN_PROGRESS: components["schemas"]["TicketListItem"][];
            ON_HOLD: components["schemas"]["TicketListItem"][];
            DONE: components["schemas"]["TicketListItem"][];
        };
        /** @description Counts per enum value. Every key is always present (zero when empty). */
        TicketSummary: {
            byStatus: {
                DEFINITION: number;
                TODO: number;
                IN_PROGRESS: number;
                ON_HOLD: number;
                DONE: number;
            };
            byType: {
                FEATURE: number;
                BUG: number;
                CHORE: number;
            };
            byOwner: {
                AI: number;
                HUMAN: number;
            };
            /** @description Counts among resolved tickets only. */
            bySolution: {
                DONE: number;
                WONT_DO: number;
            };
        };
        /** @description One comment of a ticket thread. */
        TicketComment: {
            id: number;
            ticketId: number;
            author: components["schemas"]["TicketCommentAuthor"];
            authorName: string | null;
            body: string;
            /** @description ISO-8601 text as stored. */
            createdAt: string;
        };
        /** @description New ticket. It starts as `owner=HUMAN`, `status=DEFINITION`. */
        TicketCreateInput: {
            /** @enum {string} */
            type: "FEATURE" | "BUG" | "CHORE";
            title: string;
            body: string;
            /** @description Must name an existing agent task, else 400 with a field error on `agentTaskId`. */
            agentTaskId?: number | null;
            /** @description Default false. */
            fullyReady?: boolean;
        };
        TicketStatusInput: {
            /** @enum {string} */
            status: "DEFINITION" | "TODO" | "IN_PROGRESS" | "ON_HOLD" | "DONE";
        };
        TicketOwnerInput: {
            /** @enum {string} */
            owner: "AI" | "HUMAN";
        };
        TicketAskInput: {
            question: string;
        };
        TicketDoneInput: {
            /** @description Closing comment, stored as an `AGENT` comment. */
            comment?: string;
        };
        TicketWontDoInput: {
            /** @description Closing comment, stored as a `HUMAN` comment. */
            comment?: string;
        };
        TicketCommentInput: {
            body: string;
            /** @description Moves the ticket to `TODO`, owner `AI`. Only allowed on `ON_HOLD` + `HUMAN` tickets, else 409. */
            handBackToAi?: boolean;
            /** @description Resets `fullyReady` to false. */
            clearFullyReady?: boolean;
            /**
             * @description Default `HUMAN`. `AGENT` is rejected with 403 when the request carries an authenticated session.
             * @enum {string}
             */
            author?: "HUMAN" | "AGENT";
        };
        TicketResetResult: {
            /** @description Number of seeded workshop tickets. */
            seeded: number;
        };
        /** @enum {string} */
        TicketOwner: "AI" | "HUMAN";
        /** @enum {string} */
        TicketType: "FEATURE" | "BUG" | "CHORE";
        /** @enum {string} */
        TicketStatus: "DEFINITION" | "TODO" | "IN_PROGRESS" | "ON_HOLD" | "DONE";
        /** @enum {string} */
        TicketSolution: "DONE" | "WONT_DO";
        /** @enum {string} */
        TicketCommentAuthor: "HUMAN" | "AGENT";
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
    login: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["LoginRequest"];
            };
        };
        responses: {
            /** @description Logged in. */
            200: {
                headers: {
                    /** @description Session cookie `JSESSIONID`: HttpOnly, Path=/, Expires (24 h maxAge), SameSite=Lax, plus Secure when NODE_ENV=production. */
                    "Set-Cookie"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LoginResponse"];
                };
            };
            401: components["responses"]["Unauthorized"];
        };
    };
    logout: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["EmptyObject"];
            };
        };
        responses: {
            /** @description Logged out. Empty object. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["EmptyObject"];
                };
            };
            400: components["responses"]["BadRequest"];
        };
    };
    getCurrentUser: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description The session user. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BenutzerInfo"];
                };
            };
            401: components["responses"]["Unauthorized"];
        };
    };
    testLogin: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["TestLoginRequest"];
            };
        };
        responses: {
            /** @description Logged in. */
            200: {
                headers: {
                    /** @description Session cookie `JSESSIONID`: HttpOnly, Path=/, Expires (24 h maxAge), SameSite=Lax, plus Secure when NODE_ENV=production. */
                    "Set-Cookie"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LoginResponse"];
                };
            };
            401: components["responses"]["Unauthorized"];
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
    listPersonen: {
        parameters: {
            query?: {
                /** @description Case-insensitive substring filter. The operation description names the matched field. */
                search?: components["parameters"]["SearchQuery"];
                /** @description Only contacts of this department. Ignored when missing, non-numeric or not positive. */
                abteilungId?: number;
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
    createPerson: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["PersonInput"];
            };
        };
        responses: {
            /** @description Created. */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Person"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
        };
    };
    listAllPersonen: {
        parameters: {
            query?: {
                /** @description Only contacts of this department. Ignored when missing, non-numeric or not positive. */
                abteilungId?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description All contacts (not paged). */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Person"][];
                };
            };
            401: components["responses"]["Unauthorized"];
        };
    };
    getPerson: {
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
            /** @description The contact. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Person"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            404: components["responses"]["NotFound"];
        };
    };
    updatePerson: {
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
                "application/json": components["schemas"]["PersonInput"];
            };
        };
        responses: {
            /** @description Updated. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Person"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            404: components["responses"]["NotFound"];
        };
    };
    deletePerson: {
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
    listAbteilungen: {
        parameters: {
            query?: {
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
    createAbteilung: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["AbteilungInput"];
            };
        };
        responses: {
            /** @description Created. */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Abteilung"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
        };
    };
    listAllAbteilungen: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description All departments (not paged). */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Abteilung"][];
                };
            };
            401: components["responses"]["Unauthorized"];
        };
    };
    listAbteilungenByFirma: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description Company id, a positive whole number without sign or leading zeros. */
                firmaId: components["parameters"]["FirmaIdPath"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description The departments of the company. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Abteilung"][];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
        };
    };
    getAbteilung: {
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
            /** @description The department. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Abteilung"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            404: components["responses"]["NotFound"];
        };
    };
    updateAbteilung: {
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
                "application/json": components["schemas"]["AbteilungInput"];
            };
        };
        responses: {
            /** @description Updated. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Abteilung"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            404: components["responses"]["NotFound"];
        };
    };
    deleteAbteilung: {
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
    listAbteilungPersonen: {
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
            404: components["responses"]["NotFound"];
        };
    };
    listAdressen: {
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
            /** @description One page of addresses. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AdressePage"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
        };
    };
    createAdresse: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["AdresseInput"];
            };
        };
        responses: {
            /** @description Created. */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Adresse"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
        };
    };
    listAllAdressen: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description All addresses (not paged). */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Adresse"][];
                };
            };
            401: components["responses"]["Unauthorized"];
        };
    };
    getAdresse: {
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
            /** @description The address. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Adresse"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            404: components["responses"]["NotFound"];
        };
    };
    updateAdresse: {
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
                "application/json": components["schemas"]["AdresseInput"];
            };
        };
        responses: {
            /** @description Updated. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Adresse"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            404: components["responses"]["NotFound"];
        };
    };
    deleteAdresse: {
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
    listAktivitaeten: {
        parameters: {
            query?: {
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
            /** @description One page of activities. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AktivitaetPage"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
        };
    };
    createAktivitaet: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["AktivitaetInput"];
            };
        };
        responses: {
            /** @description Created. */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Aktivitaet"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
        };
    };
    listAllAktivitaeten: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description All activities. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Aktivitaet"][];
                };
            };
            401: components["responses"]["Unauthorized"];
        };
    };
    getAktivitaet: {
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
            /** @description The activity. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Aktivitaet"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            404: components["responses"]["NotFound"];
        };
    };
    updateAktivitaet: {
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
                "application/json": components["schemas"]["AktivitaetInput"];
            };
        };
        responses: {
            /** @description Updated. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Aktivitaet"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            404: components["responses"]["NotFound"];
        };
    };
    deleteAktivitaet: {
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
    listChancen: {
        parameters: {
            query?: {
                /** @description Case-insensitive substring filter. The operation description names the matched field. */
                search?: components["parameters"]["SearchQuery"];
                /**
                 * @description Exact-match phase filter. An unknown value answers 400 with message
                 *     `Ungültiger phase-Wert: <value>. Erlaubt: NEU, QUALIFIZIERT, ANGEBOT, VERHANDLUNG, GEWONNEN, VERLOREN`
                 *     and `fieldErrors.phase`.
                 */
                phase?: components["schemas"]["ChancePhase"];
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
            /** @description One page of opportunities. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ChancePage"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
        };
    };
    createChance: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ChanceInput"];
            };
        };
        responses: {
            /** @description Created. */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Chance"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
        };
    };
    listAllChancen: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description All opportunities. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Chance"][];
                };
            };
            401: components["responses"]["Unauthorized"];
        };
    };
    getChance: {
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
            /** @description The opportunity. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Chance"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            404: components["responses"]["NotFound"];
        };
    };
    updateChance: {
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
                "application/json": components["schemas"]["ChanceInput"];
            };
        };
        responses: {
            /** @description Updated. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Chance"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            404: components["responses"]["NotFound"];
        };
    };
    deleteChance: {
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
    getDashboard: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Dashboard data. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["DashboardData"];
                };
            };
            401: components["responses"]["Unauthorized"];
        };
    };
    listSzenarien: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description All scenarios. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Szenario"][];
                };
            };
            401: components["responses"]["Unauthorized"];
        };
    };
    createSzenario: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SzenarioInput"];
            };
        };
        responses: {
            /** @description Created. */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Szenario"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            409: components["responses"]["Conflict"];
        };
    };
    getSzenario: {
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
            /** @description The scenario. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Szenario"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            404: components["responses"]["NotFound"];
        };
    };
    updateSzenario: {
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
                "application/json": components["schemas"]["SzenarioInput"];
            };
        };
        responses: {
            /** @description Updated. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Szenario"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            404: components["responses"]["NotFound"];
            409: components["responses"]["Conflict"];
        };
    };
    deleteSzenario: {
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
            /** @description Deleted. */
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
    claimNextAgentTask: {
        parameters: {
            query: {
                /** @description Task source. Checked in code, not by schema validation. */
                source: components["schemas"]["AgentTaskSource"];
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description The claimed task. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AgentTask"];
                };
            };
            /** @description No open task for this source. */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
        };
    };
    getAgentTaskSummary: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Counts per source. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AgentTaskSummary"][];
                };
            };
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
        };
    };
    resetAgentTasks: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["EmptyObject"];
            };
        };
        responses: {
            /** @description Number of rows reset. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AgentTaskResetResult"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
        };
    };
    startAgentTask: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description Record id, a positive whole number without sign or leading zeros. */
                id: components["parameters"]["IdPath"];
            };
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["EmptyObject"];
            };
        };
        responses: {
            /** @description The started task. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AgentTask"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            404: components["responses"]["NotFound"];
            409: components["responses"]["Conflict"];
        };
    };
    rejectAgentTask: {
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
                "application/json": components["schemas"]["AgentTaskRejectInput"];
            };
        };
        responses: {
            /** @description The rejected task. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AgentTask"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            404: components["responses"]["NotFound"];
            409: components["responses"]["Conflict"];
        };
    };
    completeAgentTask: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description Record id, a positive whole number without sign or leading zeros. */
                id: components["parameters"]["IdPath"];
            };
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["AgentTaskDoneInput"];
            };
        };
        responses: {
            /** @description The completed task. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AgentTask"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            404: components["responses"]["NotFound"];
            409: components["responses"]["Conflict"];
        };
    };
    getAgentTask: {
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
            /** @description The task. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AgentTask"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
        };
    };
    listAgentTasks: {
        parameters: {
            query?: {
                /** @description Filter by source. */
                source?: components["schemas"]["AgentTaskSource"];
                /** @description Filter by status. */
                status?: components["schemas"]["AgentTaskStatus"];
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
            /** @description One page of tasks. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AgentTaskPage"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
        };
    };
    claimNextTicket: {
        parameters: {
            query?: {
                /** @description Ticket type filter. An unknown value answers 400 `Ungültiger Ticket-Typ: <value>`. */
                type?: components["schemas"]["TicketType"];
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description The claimed ticket with comments. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["TicketDetail"];
                };
            };
            /** @description No claimable ticket. No body. */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
        };
    };
    getTicketBoard: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description The board. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["TicketBoard"];
                };
            };
            401: components["responses"]["Unauthorized"];
        };
    };
    getTicketSummary: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description The counts. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["TicketSummary"];
                };
            };
            401: components["responses"]["Unauthorized"];
        };
    };
    resetTickets: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["EmptyObject"];
            };
        };
        responses: {
            /** @description Re-seeded. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["TicketResetResult"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
        };
    };
    listTickets: {
        parameters: {
            query?: {
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
                /** @description Filter by type. */
                type?: components["schemas"]["TicketType"];
                /** @description Filter by status. */
                status?: components["schemas"]["TicketStatus"];
                /** @description Filter by owner. */
                owner?: components["schemas"]["TicketOwner"];
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description One page of tickets. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["TicketListItemPage"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
        };
    };
    createTicket: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["TicketCreateInput"];
            };
        };
        responses: {
            /** @description Created. */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["TicketDetail"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
        };
    };
    getTicket: {
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
            /** @description The ticket. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["TicketDetail"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            404: components["responses"]["NotFound"];
        };
    };
    setTicketStatus: {
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
                "application/json": components["schemas"]["TicketStatusInput"];
            };
        };
        responses: {
            /** @description The updated ticket. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["TicketDetail"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
        };
    };
    setTicketOwner: {
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
                "application/json": components["schemas"]["TicketOwnerInput"];
            };
        };
        responses: {
            /** @description The updated ticket. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["TicketDetail"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
        };
    };
    startTicket: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description Record id, a positive whole number without sign or leading zeros. */
                id: components["parameters"]["IdPath"];
            };
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["EmptyObject"];
            };
        };
        responses: {
            /** @description The updated ticket. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["TicketDetail"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
            409: components["responses"]["Conflict"];
        };
    };
    completeTicket: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description Record id, a positive whole number without sign or leading zeros. */
                id: components["parameters"]["IdPath"];
            };
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["TicketDoneInput"];
            };
        };
        responses: {
            /** @description The updated ticket. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["TicketDetail"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
            409: components["responses"]["Conflict"];
        };
    };
    askTicketQuestion: {
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
                "application/json": components["schemas"]["TicketAskInput"];
            };
        };
        responses: {
            /** @description The updated ticket. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["TicketDetail"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
            409: components["responses"]["Conflict"];
        };
    };
    markTicketWontDo: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description Record id, a positive whole number without sign or leading zeros. */
                id: components["parameters"]["IdPath"];
            };
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["TicketWontDoInput"];
            };
        };
        responses: {
            /** @description The updated ticket. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["TicketDetail"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
            409: components["responses"]["Conflict"];
        };
    };
    handTicketToAi: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description Record id, a positive whole number without sign or leading zeros. */
                id: components["parameters"]["IdPath"];
            };
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["EmptyObject"];
            };
        };
        responses: {
            /** @description The updated ticket. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["TicketDetail"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
            409: components["responses"]["Conflict"];
        };
    };
    addTicketComment: {
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
                "application/json": components["schemas"]["TicketCommentInput"];
            };
        };
        responses: {
            /** @description The updated ticket. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["TicketDetail"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
            409: components["responses"]["Conflict"];
        };
    };
    triggerAgentTasksRun: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description The cron run. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CronRun"];
                };
            };
            401: components["responses"]["Unauthorized"];
        };
    };
    triggerGithubIssuesRun: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description The cron run. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CronRun"];
                };
            };
            401: components["responses"]["Unauthorized"];
        };
    };
    completeCronRun: {
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
                "application/json": components["schemas"]["CronRunCompleteInput"];
            };
        };
        responses: {
            /** @description The completed run. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CronRun"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            404: components["responses"]["NotFound"];
        };
    };
    listCronRuns: {
        parameters: {
            query?: {
                /** @description Job name, for example `solve-tasks`. */
                job?: string;
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
            /** @description One page of runs. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CronRunPage"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
        };
    };
    listCronJobs: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description All jobs. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CronJob"][];
                };
            };
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
        };
    };
}
