# CFO note (read this first)

All amounts are in euros. The tool prints "$" by default. Costs marked ESTIMATE are listed in `cfo-sources.md`. An accountant should check the obrt structure, contributions and tax before any money moves. This is not financial or tax advice.

- **The margin.** Each guest-assistant property-month at €20 leaves **€16.90** (84%) after its own costs. **Break-even is 26 active properties every month.** Fixed costs are about €431 a month: obrt contributions of **€290.98/month in 2026** ([fiskai.hr](https://www.fiskai.hr/alati/kalkulator-doprinosa/), [mojafirma.hr](https://mojafirma.hr/clanci/pausalni-obrt-obveze-2026)), plus software and fuel. They keep running in winter, when nobody pays. At the ramp the panel supports (peak 20 properties), the margin is **−23%** and year 1 is **−€3,397** on €2,100 of revenue.
- **Scenario B: WhatsApp booking assistant** (`cfo-whatsapp.md`, not yet panel-tested). Each client needs its own WhatsApp API number, about **€25/month** through a provider such as 360dialog (third-party price sources: [360dialog docs](https://docs.360dialog.com/partner/get-started/pricing), [ezcontact.ai](https://ezcontact.ai/en/blog/2026-07-04-360dialog-pricing-2026-real-monthly-costs-api-fees)), plus Meta's per-message fees ([Meta pricing](https://developers.facebook.com/documentation/business-messaging/whatsapp/pricing)). At €60 a month, a client leaves only **€25.20** (42%), and break-even is 18 clients. **At €79 a month**, a client leaves €44.20 and break-even is 10. The monthly fees alone lose **−€3,912** in year 1 at €60. The tool can't model setup fees, which add 8 × €300 = **+€2,400**.
- **The line to watch: off-season fixed costs.** Volume −20% makes the guest assistant's year 1 **−€3,752**. A ±10% price change moves it only about €200.
- **Cash.** The guest assistant alone needs **about €4,097** before it pays for itself. Scenario B needs about €4,612, or about €2,200 once setup fees are counted.
- **The combined business** (one set of fixed costs, worked out by hand from the tool runs):
  guest assistant contribution €1,775 + WhatsApp contribution €1,260 + WhatsApp setups €2,400 + 4 websites × €400 = €1,600, minus fixed costs 12 × €431 = €5,172, minus startup costs €700 = **about +€1,160 in year 1, before paying the founder anything.**

## Three ways to improve the margin
1. **Check whether this can run as a second activity next to a job.** If so, paušalni obrt contributions are assessed yearly on income instead of €290.98 every month ([fiskai.hr](https://www.fiskai.hr/alati/kalkulator-doprinosa/)). That could be worth up to **+€3,490 a year**, more than every other lever combined. Confirm with an accountant.
2. **Raise the WhatsApp booking assistant to €79 a month**, or pass the €25 number fee through as a separate line. Contribution goes from €25.20 to **€44.20**, and break-even drops from 18 to **10 clients** (tool what-if).
3. **Charge €75 setup per guest-assistant property after 31 March**, and sell the "Better" rung (€180 a season). At 20 properties that adds about €1,500 + €300.

## The board's money conditions
- [x] Competitor prices mapped before setting the price.
- [x] Guarantee costed: about €3 of variable cost per refunded property-month, with a maximum of about €720 of revenue given up at a 20% claim rate on 30 properties.
- [ ] Revenue per client after off-season pauses: €120 a year per guest-assistant property, and €480–€950 a year per WhatsApp client. **Neither covers fixed costs alone at the panel's volumes.**
- [ ] Number of target businesses: **still unknown.** The ramps are estimates.

---

# Unit economics: Almissa Digital: AI guest assistant (one property, one active month)

Every number below comes from the input file. Nothing is looked up or guessed.

## One property-month

| line | per property-month |
| --- | ---: |
| Price | $20.00 |
| AI model usage per property (estimate) | -$1.50 |
| WhatsApp forwarding + message templates (estimate) | -$0.50 |
| Hosting / chat widget share (estimate) | -$0.50 |
| Payment / bank transfer fees ~3% (estimate) | -$0.60 |
| **Contribution** (what each property-month leaves to pay the fixed costs) | **$16.90** (84%) |

## The margin that matters

Fixed costs: $431 a month (Paušalni obrt contributions 2026 (MIO + HZZO, fiksaj.hr / mojafirma.hr) $291, Software: AI subscription, WhatsApp API provider, domain/hosting (estimate) $80, Phone and fuel for in-person visits (estimate) $60).

- **Break-even: 26 property-months a day.** Below that you lose money every month.
- **Profit margin at your plan** (20 a day): **-23%** of every sale, after every cost.
- Capacity: 120 a day.

## Year 1, month by month

| month | property-months a day | revenue | profit | cumulative (after $700 startup) |
| ---: | ---: | ---: | ---: | ---: |
| 1 | 0 | $0 | -$431 | -$1,131 |
| 2 | 2 | $40 | -$397 | -$1,528 |
| 3 | 5 | $100 | -$346 | -$1,875 |
| 4 | 10 | $200 | -$262 | -$2,137 |
| 5 | 16 | $320 | -$161 | -$2,297 |
| 6 | 20 | $400 | -$93 | -$2,390 |
| 7 | 20 | $400 | -$93 | -$2,483 |
| 8 | 18 | $360 | -$127 | -$2,610 |
| 9 | 8 | $160 | -$296 | -$2,906 |
| 10 | 2 | $40 | -$397 | -$3,303 |
| 11 | 2 | $40 | -$397 | -$3,700 |
| 12 | 2 | $40 | -$397 | -$4,097 |

- **Year 1 operating profit: -$3,397** on $2,100 of revenue.
- After the $700 startup spend: -$4,097.
- Startup money earned back: not within year 1.
- Cash you need before it pays for itself: **$4,097**.

## What if

| scenario | margin at plan | break-even a day | year 1 profit |
| --- | ---: | ---: | ---: |
| Base plan | -23% | 26 | -$3,397 |
| Price -10% | -37% | 29 | -$3,607 |
| Volume -20% | -50% | 26 | -$3,752 |
| Unit costs +15% | -26% | 27 | -$3,446 |

## Red flags

- Year 1 loses money on operations (-$3,397).
- The startup spend is not earned back within year 1.
