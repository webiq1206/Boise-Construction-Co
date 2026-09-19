---
name: Bounded live qualification accounting
description: Distinguish explicit owner grants and conservative usage accounting from invoices
---
An explicit owner-approved conservative all-token rate bound can qualify a
tool-free short-context scenario without claiming exact invoice reconciliation.
Do not impose an assistant-created separate approval gate after the owner has
already authorized that scenario and cap.

**Why:** Managed billing documentation uses public API prices, while exact
invoices may arrive later. Verified model, service tier, token usage, and a
conservative reservation establish bounded spending without inventing an invoice.

**How to apply:** Pin the actual configured provider/model and request, prohibit
unpriced tools and fallback, reserve durably before dispatch, and preserve one
canonical ledger across all stages/manifests of the grant. Unknown billing or
response identity must block continuation. Never reset reservations or interpret
a past grant as authorization for a new scenario. A source-only drain export is
not evidence that an old deployed process has stopped.