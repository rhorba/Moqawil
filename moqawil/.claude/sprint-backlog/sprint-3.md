# Sprint 3 — Client Detail · Invoice Edit · Email · E2E · Threshold Alerts

**Goal**: Close the remaining MVP DoD gaps: client detail ledger, invoice edit/send, email PDF delivery, annual threshold email alerts, Playwright E2E happy-path test.

**Status**: COMPLETE ✅
**Started**: 2026-05-19
**Completed**: 2026-05-19

---

## Backlog

| ID    | Task                                                   | Specialist    | Size | Status      |
|-------|--------------------------------------------------------|---------------|------|-------------|
| S3-01 | Client detail page `/clients/[id]` — ledger + cap badge| Frontend Dev  | M    | ✅ done     |
| S3-02 | Invoice edit page `/invoices/[id]/edit`                | Frontend Dev  | M    | ✅ done     |
| S3-03 | Invoice "mark sent" + email PDF (optional SMTP)        | Backend Dev   | M    | ✅ done     |
| S3-04 | Annual threshold email alerts (70 / 90 / 100 %)        | Backend Dev   | M    | ✅ done     |
| S3-05 | Playwright E2E — signup → onboard → invoice → declaration | Tester     | L    | ✅ done     |
| S3-06 | Sprint 3 snapshot                                      | Project Monitor| S   | ✅ done     |

---

## DoD items this sprint closes

- [x] User can create, **edit**, send, and mark-as-paid an invoice
- [x] Per-client annual ledger view showing all invoices contributing to YTD total
- [x] Email PDF to client (optional — degrades gracefully if SMTP not configured)
- [x] Dashboard email alerts at 70%, 90%, 100% of threshold
- [x] One e2e Playwright test covering full happy path
