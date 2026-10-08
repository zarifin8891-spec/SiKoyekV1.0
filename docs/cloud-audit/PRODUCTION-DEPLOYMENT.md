# Production frontend deployment — 08 October 2026

The user explicitly authorized deploying the reviewed frontend for MASTER and KONSTRUVA together, without database changes. PR #24 was merged after all 11 PR workflows and the branch test/package workflows passed.

- Deployed source commit: `89feef0a41fe427ad10e5f9c7ce21081cc73ea3e`.
- Application revision: `8b8df8a189496e5575f15ada40193c24b0a6370d6865a4720b9dc5b781c631f8`.
- GitHub Pages run: [37765031484](https://github.com/zarifin8891-spec/SiKoyekV1.0/actions/runs/37765031484); result **success**.
- Publication completed: `2026-10-08T10:41:03Z` (17:41 WIB, 08 October 2026).
- Static verification completed: `2026-10-08T10:46:26.060923+00:00`.
- Live URLs: [MASTER](https://zarifin8891-spec.github.io/SiKoyekV1.0/Master/), [KONSTRUVA](https://zarifin8891-spec.github.io/SiKoyekV1.0/konstruva/), [environment selector](https://zarifin8891-spec.github.io/SiKoyekV1.0/).

## Verification

All **311 live static files** were retrieved through HTTP GET and checked. The release manifest matches the reviewed package; SOURCE_COMMIT.txt matches the merge commit. All **153 common application files per tenant** match their SHA-256 manifest hashes. The two tenant environment files match their approved configuration hashes. The downloaded artifact also passes the offline release verifier (common bytes, configuration validation, and local asset references).

| Environment | Supabase project (existing) | Configuration SHA-256 |
| --- | --- | --- |
| MASTER | mmkusplegmittrlxqxby | 8e27dde523e9e46dccf094d9a9079f6b7bc23416aa28dd12726c95ef2a5369a7 |
| KONSTRUVA | fadxsycdgzuctvmhhjty | 1335d8817f0c208a48a03b3f712f2877c26f992534d00c5905254d038e5343f1 |

The production workflow reran 23 Foundation unit tests and 15 legacy test suites, checked the reviewed release lock, and prepared the previous Cloud artifact before publication. Prior isolated validation covers 55/55 active UI comparisons, 31 browser checks, and preserved production business-handler/engine fingerprints; see the existing audit evidence.

## Recovery and future releases

The previous static Cloud package is saved as artifact `sikoyek-before-foundation-37765031484` (ID 11544131932), retained until 06 January 2027. SHA-256: `9d967c1df459fb7428c2635060d478d6cc13aabf8b74f7ea577a3ec1b7b090aa`. The publisher offers the explicit `restore-cloud-2026-10-07` mode for the observed pre-Foundation release.

One Main-only publisher owns both tenant paths. Future Cloud clients are registered through the configuration files listed in `deployment/release-lock.json` and use the same application source. Application changes must pass review and update the revision lock before publication. This report changes documentation only and does not trigger the publisher.

## Scope

No database connection, login, SQL, data write, Auth/RLS modification, Edge deployment, or Supabase configuration change was performed. Live verification inspected static assets only. Actual production login, database latency, RLS, and multiuser writes are outside these checks. LAN migration remains paused; the shared foundation is prepared for a later backend adapter.
