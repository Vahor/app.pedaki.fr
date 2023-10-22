# Clear old pending

Remove all pending orders that are older than 30 minutes.

And all workspace invitations that are older than 3 hours.

Cron: `*/30 * * * *`
- Run `clear-old-pending` every 30 minutes.


Variables:
```env
RAILWAY_DOCKERFILE_PATH=cron/clear-old-pending/Dockerfile
DATABASE_URL=
PRISMA_ENCRYPTION_KEY=
PENDING_MAX_AGE=30
INVITATION_MAX_AGE=180
```