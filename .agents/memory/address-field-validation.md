---
name: Address field vs verbose geocoder strings
description: Why the consultation form must store a cleaned address, not the raw Nominatim formattedAddress.
---

# Cleaned address in the consultation form

The consultation `address` field is validated by `HOUSE_NUMBER_REGEX`
(`/^\d+[A-Za-z]?\s+\S/`) in `shared/addressValidation.ts`. The raw Nominatim
`formattedAddress` looks like `"3024, West Fairview Avenue, North End, Boise, …"`
— the comma right after the house number makes the regex fail and shows a false
"Please include your house number" error.

**Rule:** never write the raw geocoder `formattedAddress` (or a raw suggestion
`description`) into a regex-validated address field. Always pass it through
`buildCleanAddress(profile)` first, which yields `"<number> street, city, ST zip"`.

**Why:** the verbose string is for display/search, not for a field that asserts a
specific shape. Every code path that sets the form address must clean it:
`AddressAutocomplete` (enrich onChange, selectSuggestion optimistic preview,
success-card display) and `ConsultationForm.handleProfileResolved`.

**How to apply:** if you add another place that sets the address from a profile
or suggestion, route it through `buildCleanAddress`. ZIP is no longer a manual
field — derive it via `propertyProfile.zip` then `extractZip(address)` fallback.
