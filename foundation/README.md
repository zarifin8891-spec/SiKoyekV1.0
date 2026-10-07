# Common SiKoyek Foundation

The reference is Closed `dcd50d1`, not current Main. This branch does not deploy. Cloud and LAN should consume this same UI source once LAN resumes.

- `tokens.css`: central Closed colors and typography values.
- `dashboard.css`: original static cascade consolidated in its original order. Secondary pages reuse identical cascades; `styles-manifest.json` records the original inputs. Legacy files still used by dynamic modal/report loaders are retained. Do not append a new version of CSS for each screen adjustment.
- `runtime.js`: reusable currency formatters, URL-based asset registry with load/error promises, single-flight tasks, idempotent style updates and one native DOM observer shared by legacy subscribers. Native browser prototypes are not overwritten.
- `backend.js`: one Cloud client per endpoint/publishable key. Reads share only identical in-flight operations, keyed by full query, session/user/token and generation. No persistent response cache. Writes, auth changes and Edge invocations invalidate in-flight entries. Independent abort signals remain independent. LAN adapter selection is possible before the first client via `registerBackend(factory)`; no LAN implementation is included.
- `repository.js`: shared lifecycle reads. Lists query bounded batches and paginate history IDs; actions still recheck exact counts fresh before Edit/Delete. Detail tabs reuse the already loaded complete detail histories; incomplete/error detail falls back to fresh reads. Status/progress/history rules are unchanged.
- `master-modal.js` and `../master-data-compact-runtime-v8.js`: Closed workflow additions now present in source. Reordering and style assignment are idempotent.

Business formulas remain in the unchanged Closed engines. CRUD payloads, validation and permissions remain in their existing modules. Presentation code should call the shared runtime/repository rather than create another client, formatter, polling loop or asset loader.

`docs/cloud-audit/closed-workflows` keeps the deployment/auto-patch recipes for reference only. They are outside GitHub Actions' active workflow directory. Never restore them to deploy this experimental branch.
