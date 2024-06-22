# Recovery verification — 7 October 2026

Fresh verification after source and commit history recovery:

| Check | Result |
| --- | --- |
| Maven `verify` | 13 tests; zero failures, errors, or skipped tests; packaged executable jar |
| Gateway `npm test` | 5 HTTP tests passed |
| Frontend `npm test` | 5 component tests passed |
| Frontend `npm run build` | Vite production build succeeded |
| `node scripts/reservation-smoke.mjs` | Real Java → Express catalog, reservation decrement, and oversell rejection; 7 assertions passed |
| npm installation audit | Zero reported vulnerabilities in both dependency trees |

Environment: macOS x64, portable Temurin JDK 21.0.12.1, Maven 3.9.11, Node.js 26.5.0, npm 11.17.0. Dependencies were restored from their registries and npm lockfiles regenerated from the exact versions in each package manifest. No application code changes were needed.

Gateway tests and the smoke test require permission to listen on localhost; they passed with that permission. The smoke test used its own temporary H2 database and cleaned it up on exit. Java tests verify concurrency and persistence as well as HTTP behavior.

The workflow configures Java 21 and Node 24, installs both npm trees from lockfiles, runs Maven verification, and then runs the same tests, build, and smoke check. Hosted CI and browser layout were not exercised in this recovery run.

For a portable Java runtime, set `JAVA_HOME` to the extracted JDK home and add the extracted Maven `bin` directory to `PATH`, then follow the repository README. On macOS the JDK home is the extracted bundle's `Contents/Home`; on Linux it is the extracted JDK directory. No machine-specific absolute paths are required.
