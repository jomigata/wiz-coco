# Local Postgres (TASK-071)

```bash
docker compose -f docker-compose.postgres.yml up -d
```

```text
DATABASE_URL=postgresql://wizcoco:wizcoco_local@127.0.0.1:5432/wizcoco_dispatch
```

Apply schema:

```bash
psql "$DATABASE_URL" -f backend/db/migrations/001_dispatch_recipients.sql
```

Design: [`docs/postgres-hybrid-design-ko.md`](../docs/postgres-hybrid-design-ko.md)
