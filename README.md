# Small Goods — Java, React, and Node.js retail demo

Independent portfolio demonstration of service boundaries and safe stock reservation. A React storefront talks to an Express catalog gateway, which combines local prices with a Spring Boot inventory API. H2 persists products and reservations on disk. No paid credentials are required.

## Simulated history

This code was created in **October 2026**. Commit dates are a **simulated development timeline for 2023–2024**, not evidence of work performed or employment in those years. This is not an implementation for an actual client or employer. See [TIMELINE.md](TIMELINE.md).

Spring Boot 3.5.16, Java 21, Express 5.1.0, React 19.3.0, Vite 8.3.3, Vitest 5.0.3 and their pinned dependencies are **modern reconstruction choices**; they may postdate the simulated commits. Maven pins Java dependencies through the Spring Boot parent, and both Node projects include lockfiles.

## Run locally

Requirements: Java 21, Maven 3.9+, Node.js 24 (or Node 22.12+), and npm. Initial dependency installation requires internet access. Run each service in a separate terminal, from the repository root:

```sh
mvn -f backend/pom.xml package
java -jar backend/target/inventory-1.0.0.jar
```

```sh
npm ci --prefix gateway
npm start --prefix gateway
```

```sh
npm ci --prefix frontend
npm run dev --prefix frontend
```

Open http://127.0.0.1:5173. The browser uses `/api`; Vite proxies those requests to the gateway at port 3001. Inventory listens on port 8080. The fixture starts with 12 ceramic mugs and 8 canvas totes. Reservations permanently reduce available stock in this demo.

Set `INVENTORY_URL` and `PORT` for the gateway if needed. Inventory accepts `INVENTORY_DB_URL`, for example `jdbc:h2:file:./data/retail`. The database path is relative to the process working directory. Both HTTP services bind to localhost. Do not expose this unauthenticated demo to a public network.

To reset fixtures, stop the inventory process and remove its local `data` directory. This deletes reservations and stock changes. Seeding inserts absent products only and does not replenish stock on restart.

## API

| Service | Endpoint | Result |
| --- | --- | --- |
| Inventory | `GET /api/products` | Products with SKU, name and available stock |
| Inventory | `POST /api/reservations` | Durable reservation; HTTP 201 |
| Gateway | `GET /api/catalog` | Inventory plus integer-cent USD prices |
| Gateway | `POST /api/reservations` | Validates and forwards to inventory |

```sh
curl http://127.0.0.1:3001/api/catalog
curl -X POST http://127.0.0.1:3001/api/reservations \
  -H 'Content-Type: application/json' \
  -d '{"sku":"MUG","quantity":2}'
```

Reservation input uses an uppercase SKU of 1–32 letters/digits/hyphens and an integer quantity of 1–100. Invalid JSON or inputs return 400, an unknown product returns 404, and insufficient stock returns 409. Errors contain an `error` string. The gateway returns 502 for inventory connection errors or its three-second timeout.

A timeout after a POST can leave the reservation outcome unknown. Refresh stock before retrying. Repeated API requests create separate reservations; the UI prevents duplicate clicks while a request is in progress, but the system does not promise distributed exactly-once semantics.

## Architecture and limits

The inventory service owns stock and reservation records. Persistence uses explicit JDBC and H2 instead of JPA; the small model keeps transaction and concurrency behavior visible in SQL. One conditional SQL update (`available >= requested quantity`) enforces the invariant under concurrency; recording the reservation shares the same Spring transaction, so insert failures roll back stock. The database also rejects negative stock. The gateway owns demo pricing and keeps inventory transport outside the UI. Prices are display-only; no payment or accounting is implemented.

H2 file mode is appropriate for this reproducible single-process demo. Multiple inventory processes cannot share the same file, and there is no migration framework, authentication, reservation expiry/cancellation, or checkout. Adapting this to a deployed system requires an external database, migrations, authorization, and an explicit retry/idempotency contract. The production frontend bundle needs an HTTP host with `/api` routed to the gateway; the documented Vite server supplies that route for local development.

## Verify

```sh
mvn -f backend/pom.xml verify
npm test --prefix gateway
npm test --prefix frontend
npm run build --prefix frontend
node scripts/reservation-smoke.mjs
```

The smoke script starts the packaged Spring jar on an ephemeral port with its own temporary database, runs the real Express gateway, verifies catalog aggregation and a reservation decrement, rejects overselling, then stops the processes and removes the temporary database. Build the jar first with Maven.

Verified locally in October 2026: **13 Java tests**, **5 gateway HTTP tests**, **5 React component tests**, an executable Spring Boot jar, the Vite production build, and the real Java → Express flow (7 business assertions). The concurrency test exercises five rounds of 32 buyers against 12 units. Persistence verification restarts the application against a temporary file database. CI repeats the same checks on Linux.

Browser layout and deployed hosting have not been exercised. Component tests use an HTTP response fixture for the browser boundary; the smoke test independently covers the real Java and Node service boundary.

MIT license; see [LICENSE](LICENSE).
