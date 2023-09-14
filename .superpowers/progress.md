# SDD ledger — plan: /Users/aaa/.codex/visualizations/2026/10/06/01a111db-6d37-7500-a0c6-e549df01c4d7/github-portfolio-timeline/docs/superpowers/plans/2026-10-06-java-react-node-retail.md
Pre-flight: service owns products and reservations; gateway enriches inventory products with local pricing; frontend uses gateway only. No interfaces shared between repositories.
Ruling: use H2 JDBC conditional updates rather than a larger JPA model — preserves durable transactional stock and keeps demo scope modest — cost if wrong: database adapter change.
