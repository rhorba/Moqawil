# Vendored OASIS UBL 2.1 XSD schema set

Sprint 5 (S5-08). These are the real, unmodified OASIS UBL 2.1 schema files
needed to validate `mapInvoiceToUbl`'s output with `xmllint --schema`,
replacing Sprint 4's hand-rolled structural/order heuristic with genuine
schema validation.

**Source**: `http://docs.oasis-open.org/ubl/os-UBL-2.1/xsd/`
**Version**: UBL 2.1 (OS — OASIS Standard), published 2013-11-04
**Fetched**: 2026-08-10

## Layout

```
maindoc/UBL-Invoice-2.1.xsd   — the entry point, validates against this one
common/*.xsd                   — every schema transitively imported by it
```

`common/` contains the full transitive closure of imports starting from
`UBL-Invoice-2.1.xsd` (resolved by hand, one level at a time): common
aggregate/basic/extension components, qualified/unqualified data types,
the CCTS_CCT core module, and the signature-related schemas (UBL invoices
declare `UBLExtensions` which pull in `CommonSignatureComponents` even
though Moqawil's generator never populates a signature — Barid eSign
signing is unbuilt, Sprint 5+ per `docs/architecture-sprint4-e-invoicing.md`).
Relative `schemaLocation` paths between these files are OASIS's own and are
preserved as-is — do not flatten or rename these files, `xmllint` resolves
imports by relative path.

## Do not hand-edit

These are vendored third-party files, not project source. If UBL publishes
a 2.1 errata/patch release, re-fetch the whole set from the URL above rather
than patching individual files.
