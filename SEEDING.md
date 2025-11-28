## Mandsaur demo data seeding

**Danger: destructive operation.** The `mandsaurSeed` script **drops the entire MongoDB database** pointed to by your `MONGO_URI` / `MONGODB_URI` and then recreates demo data centered around **Mandsaur (458001, Madhya Pradesh, India)**.

### Prerequisites

- A MongoDB instance reachable from this backend.
- `.env` in `ftifto-backend` with at least:

```bash
MONGODB_URI=mongodb://localhost:27017/tifto-dev
JWT_SECRET=some-long-random-string
```

You can also use `MONGO_URI`; the script will prefer `MONGO_URI` and fall back to `MONGODB_URI`.

### Run (local / development only)

From the `ftifto-backend` directory:

```bash
cd ftifto-backend
node scripts/mandsaurSeed.js
```

What this does:

- Connects to the database in `MONGO_URI` / `MONGODB_URI`.
- **Drops the entire database** (all collections and data).
- Seeds:
  - A `Mandsaur Zone` polygon around coordinates \\(24.0667^\u00b0 N, 75.0833^\u00b0 E\\).
  - Multiple restaurants, categories, and products with addresses in **Mandsaur, 458001, Madhya Pradesh, India**.
  - One seller user per restaurant (email pattern: `<restaurant-name>@mandsaur.test`).

You can rerun the script at any time; it will always wipe the database first and then recreate the same Mandsaur-focused demo data.

### Safety notes

- **Do not run this against production** or any Mongo cluster that holds real data.
- Double-check that the database name at the end of your URI is a **local/dev** database before running:

```bash
MONGODB_URI=mongodb://localhost:27017/tifto-dev
```


