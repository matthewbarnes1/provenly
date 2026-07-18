# Provenly

**Your work, with receipts.**

Provenly builds proof-of-process portfolios: log the stages of a creative project as they happen, and each entry is timestamped and sealed into a SHA-256 hash chain. The public proof page shows the journey behind the work — the one thing AI can't fake backwards.

- Example proof page: `/p/demo`
- Whitepaper: [WHITEPAPER.md](WHITEPAPER.md) (served at `/whitepaper`)

## Run

```bash
npm install && npm start   # http://localhost:3003
```

Node >= 22.5 (built-in `node:sqlite`, zero native deps). Deploys to Vercel out of the box (`/tmp` DB — demo data reseeds on cold start).

Built July 2026 as part of a three-team SaaS codeathon. MIT licensed.
