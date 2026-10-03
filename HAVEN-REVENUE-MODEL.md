# Havën Schedule — Revenue Model

_Built 2026-09-19 for Hans (Semarang, Indonesia). All assumptions stated so they can be argued with._

## Headline

**Realistic year one: ~$70/month net (Rp 1.2M/month).**
**If it goes well: ~$1,000/month net (Rp 18M/month).**
**Most likely outcome: close to $0 — because distribution, not code, is the bottleneck.**

## Assumptions

| Variable | Value | Basis |
|---|---|---|
| Exchange rate | Rp 17,600 / USD | Sept 2026 average |
| Indonesian price | Rp 199,000 / year (~$11.30) | Estimate. Indonesia avg app spend is **$5/yr across all apps** |
| Global price | $60 / year | Comparable indie productivity tools |
| Installs → paying | 1.0% – 2.4% | Freemium benchmark is 1–4%; low end used because the free tier is generous and local-first |
| Platform fee | 15% | Google Play small-developer tier |
| Base cost | $12/yr domain + Firebase scaling | Firestore free tier holds until meaningful scale |

## Scenarios

| Scenario | Installs | Paying | Gross/yr | After 15% | Costs | Net/month |
|---|---|---|---|---|---|---|
| Organic only | 500 | 5 | $57 | $48 | $12 | **$3** (Rp 53k) |
| Good launch | 6,000 | 90 | $1,017 | $864 | $20 | **$70** (Rp 1.2M) |
| Good launch, global price | 6,000 | 90 | $5,400 | $4,590 | $20 | **$381** (Rp 6.7M) |
| Viral growth | 60,000 | 1,440 | $16,272 | $13,831 | $1,500 | **$1,028** (Rp 18.1M) |

## What actually moves the number

1. **Distribution** — 90% of the variance. 500 installs vs 60,000 installs is a 100x range. No marketing channel exists yet.
2. **Pricing** — a clean 5.4x lever. Same product, same users, global price instead of Indonesian price. This is free money if the product can serve non-Indonesian users.
3. **Conversion** — a 4x lever at most, and the hardest to move. Improving retention improves it; adding features usually doesn't.

**Conclusion:** optimisation work on the app (refactoring, new features) affects the third lever. The first two are where the money is.

## Market reality (sourced)

- Indonesia app market: **$1B revenue in 2024**, +31.9% YoY, 200M+ smartphone owners, **>90% Android**
- **Average Indonesian spends $5/year on apps — total, across every app.** Not $5/month.
- Freemium free-to-paid conversion benchmark: **1–4%** typical, 2–5% for good products
- Motion (AI calendar, US/EU, B2B pricing) reached **~$50M ARR** — that is the ceiling of this category, achieved with a paid sales motion and Western pricing

## Strategic options

| Option | Effort | Expected return | Notes |
|---|---|---|---|
| Personal tool only | None | $0 | Already achieved. Legitimate outcome. |
| Portfolio piece | None | ~$0 direct, real career value | A 57k-line shipped PWA is a strong junior-dev signal |
| Indonesian freemium | High | $3–70/mo | Requires a growth channel that doesn't exist yet |
| **Global freemium** | Medium | $380–1,000/mo | Same build, English UI, global pricing. Highest return per unit of effort. |
| Niche B2B (students, freelancers) | High | Unclear | Needs a "one thing" that Google Calendar can't do |

## Open question

**What does Havën do that Google Calendar cannot?**
Not yet answered. Until it is, none of the publishing options above can be evaluated properly — and it is cheaper to answer now than after launch.

## Known product risks to revenue

- `HUB_MOBILE_DISABLED = true` disables the flagship bento canvas below 768px. In a >90% Android, mobile-first market, the differentiator is off on the device most users hold.
- Local-first architecture means users can use the app indefinitely without paying — structurally lower conversion than cloud-locked competitors.
- 57k lines of unminified, unbundled JS is a heavy load on mid-range Android over metered data.
