---
name: Test scripts — default PDF behavior
description: When running test-{th,vn,hk}-*.sh scripts, don't pass a PDF path unless the user/context explicitly calls for a specific one
type: feedback
---

When invoking `scripts/test-th-claim.sh`, `scripts/test-vn-claim.sh`, or `scripts/test-hk-document.sh`, do NOT pass a PDF path argument by default. Let the script fall back to its built-in S3 test fixture.

Only pass a specific PDF when:
- The user explicitly provides a file path
- The session context requires testing a specific document (e.g., reproducing a bug on a particular claim, investigating extraction for a specific file)

**Why:** The scripts already handle the default case (downloading `th-claim.pdf` / `vn-claim.pdf` / `hk-outpatient.pdf` from `s3://banyan-reference-data/test-fixtures/`). Passing a PDF unnecessarily adds noise and couples the run to a transient local file.

**How to apply:**
- Default: `bash scripts/test-vn-claim.sh --mode prod`
- Only when asked: `bash scripts/test-vn-claim.sh /path/to/specific.pdf --mode prod`
