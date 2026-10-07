# Customer Configuration Template

Copy this file outside the public repository when filling real customer credentials.

## Customer

- Customer name: `<CUSTOMER_NAME>`
- Customer code/slug: `<CUSTOMER_SLUG>`
- Deployment date: `<YYYY-MM-DD>`

## Supabase

- Project name: `<SUPABASE_PROJECT_NAME>`
- Project ID: `<SUPABASE_PROJECT_ID>`
- Region: `<SUPABASE_REGION>`
- Project URL: `<https://...supabase.co>`
- Publishable/anon key: `<DO_NOT_COMMIT_REAL_SECRET>`

## First ADMIN

- Email: `<ADMIN_EMAIL>`
- Full name: `<ADMIN_NAME>`
- Role: `ADMIN`
- Role ID: `<LOOK_UP_FROM_TARGET_DATABASE>`

## Frontend

- Customer Pages path: `/SiKoyekV1.0/<CUSTOMER_SLUG>/`
- Deployment source: GitHub Actions
- Canonical chain: `push → Deploy SiKoyek V1.0 → Deploy SiKoyek Unified Pages`

## Security

Never store the following in this repository:

- Supabase service-role key
- Customer passwords
- Personal credentials
- Production secrets
