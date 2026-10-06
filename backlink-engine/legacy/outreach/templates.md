# Outreach & acquisition templates

The engine drafts a personalized message from these per-channel templates and queues it in
`outreach/queue.json`. **Nothing sends automatically** — a human approves each batch. Placeholders
in `{{curly}}` are filled per opportunity. Keep every message honest, specific, and non-spammy;
generic mass-mail is what triggers the very penalties this program avoids.

Signature block for all emails:
```
{{senderName}}
Boise Remodeling Co · boiseremodeling.co
{{senderPhone}} · Boise / Treasure Valley, ID
```

---

## 1. Self-serve profile / citation (Houzz, Angi, Yelp, BirdEye, Alignable, Chamber, citation pack)
No email. Engine produces a **submission packet** (`outreach/citations/{{id}}.json`) with the exact
NAP + fields to enter, and a checklist. A human (or a form-fill automation with approval) submits.
```
Business name: Boise Remodeling Co
Category: Design-Build Remodeling Contractor / General Contractor
NAP: {{address}} · {{phone}} · boiseremodeling.co
Hours / service area: Boise, Meridian, Eagle, Nampa, Star, Kuna, Garden City
Short desc (155 char): {{shortDescription}}
Long desc: {{longDescription}}
Photos: {{portfolioAssets}}
```

## 2. Association / program application (NARI Idaho, NARI, BCA SW Idaho, Idaho Power trade-ally)
```
Subject: Membership inquiry — Boise Remodeling Co (design-build remodeler)

Hi {{orgName}} team,

We're a design-build remodeling company serving the Treasure Valley and would like to join
{{orgName}} / apply to {{programName}}. Could you send current membership requirements, dues,
and the directory-listing details?

We hold {{licenseOrCreds}} and focus on {{specialties}}. Happy to provide references.

Thanks,
{{signature}}
```

## 3. Digital PR — journalist query response (This Old House, Featured/Qwoted, Statesman, BoiseDev)
```
Subject: Re: {{queryTitle}} — expert source (Boise remodeler)

Hi {{journalist}},

Responding to your query on {{topic}}. I'm {{senderName}} with Boise Remodeling Co, a design-build
remodeler in Idaho's Treasure Valley.

{{2-4 sentence, genuinely useful, quotable answer with a concrete local data point or number}}

Feel free to quote directly. Credit: {{senderName}}, Boise Remodeling Co (boiseremodeling.co).
More detail or a photo on request.

{{signature}}
```
Rule: only respond when we can add real expertise/data. No filler. This keeps acceptance high and
protects sender reputation.

## 4. Unlinked brand-mention reclamation
```
Subject: Thanks for the mention — quick request

Hi {{name}},

Thank you for mentioning Boise Remodeling Co in "{{pageTitle}}" ({{pageUrl}}) — we appreciate it.
Would you be open to linking the mention to our site so readers can find us directly?
{{ourUrl}} is the best page. Either way, thanks for the kind words.

{{signature}}
```

## 5. Resource-page / broken-link building
```
Subject: A resource for your {{pageTopic}} page

Hi {{name}},

I was reading your {{pageTopic}} page ({{pageUrl}}) — genuinely useful.
{{IF broken}} I noticed the link to {{deadTarget}} no longer resolves. {{ENDIF}}
We published a guide that may be a good fit for your readers: "{{ourGuideTitle}}" ({{ourGuideUrl}}) —
it covers {{whatItCovers}} for Treasure Valley homeowners.

No worries either way — just thought it might help.

{{signature}}
```

## 6. Supplier / manufacturer dealer-locator request
```
Subject: Installer/dealer listing request — {{brandName}}

Hi {{brandName}} team,

Boise Remodeling Co installs {{brandProducts}} on remodels across the Treasure Valley. Could you add
us to your "Find a Dealer / Find an Installer" locator? Details:
{{NAP + service area + account/rep if any}}

Thanks,
{{signature}}
```

## 7. Local partnership (realtors, designers, stagers, photographers)
```
Subject: Referral partnership — remodeling + {{theirTrade}}

Hi {{name}},

We're a Treasure Valley design-build remodeler and regularly work alongside {{theirTrade}}s. We'd
love to explore a referral partnership and cross-list each other as trusted local resources
(a linked mention on each site's partners/resources page). Open to a quick call?

{{signature}}
```
