Seed usage

- Deterministic seed: `node prisma/seed/seed.ts --dry-run --seed=12345`
- Dry run: `--dry-run` will skip database writes and show what would be created (useful for preview and tests)
- Clean DB: use `--clean` to perform deleteMany cleanup before seeding (not enabled by default)
- Run only parts: use `--parts=users,properties,rooms,popularSearches` or `--parts=all` to run a subset of seed steps
- Clean DB: use `--clean` to perform deleteMany cleanup before seeding (not enabled by default). When cleaning a non-dry-run, you must pass `--confirm-clean` as well to confirm destructive action.
- Performance: rooms are now seeded in **chunks** (env `SEED_CHUNK_SIZE`, default 200) and embeddings are inserted in bulk per chunk.
- Geocoding: enable `GEOCODE=1` to call OSM Nominatim and cache results to `prisma/geocode-cache.json` (rate-limited, run sparingly).
- Embedding metadata: embedding provenance (seed, counter) is stored in `prisma/embeddings-metadata.json` for reproducibility.
- Logging: enable JSON structured logs with `LOG_JSON=1`.
- Benchmark: use `node scripts/dev/seeds/seed-benchmark.js` to run quick dry-run comparisons.
- Tests: run `npx ts-node scripts/dev/seeds/test-seed-utils.ts` to validate utils.
- Configure seed via environment variable: `SEED` or CLI `--seed=N`

Notes:
- Embeddings are generated with a seeded RNG for reproducibility
- To actually write to DB, omit `--dry-run` (ensure you are pointing to the dev DB)
