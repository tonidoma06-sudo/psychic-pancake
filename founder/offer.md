# The offer: "Mirni Kolovoz" (Quiet August) Season Pass

The method is the Offers lens from `founder-board/lenses.md`: a summary of a published framework, written in our own words.

## 1. The problem list, in the hosts' words (from the panel and competitor complaints)

Before buying
1. "My guests like talking to me, not a robot." (values, 5 hosts; habit, 6)
2. "Booking and Airbnb already send messages for free." (need, 14)
3. "A wrong answer costs me a review." (trust, 11)
4. "A new one-person company: what if it disappears mid-season?"
5. "Is it legal with guests' data? Who is responsible?" (GDPR, raised by 6 hosts)
6. "€35 a month for every apartment adds up." (per-property pricing)
7. "€150 setup before I've seen anything."
8. "I only need it in July and August."
9. "I need to see a neighbour use it first."
10. "My guests are older Germans. Will they scan a QR code?"

During
11. "I can't update the answers myself."
12. "Who answers if it breaks in August?"
13. "The real problems (keys, air conditioning, late arrivals) still come to me."
14. "Will its German or Polish sound cold or wrong?"

After
15. "How do I know it saved me anything?"
16. "Does it hurt my reviews?"
17. "Paying again next year for the same thing."
18. "If I stop, I lose what I set up."

## 2. Solutions, scored (value to the host 1–5 / cost to deliver 1–5)

| # | solution | value | cost | keep? |
|---|---|---:|---:|---|
| 1, 13 | **"Host first" rule:** the assistant handles only routine questions (Wi-Fi, parking, check-in, beaches) and offers a one-tap "message the host" button on every answer | 5 | 1 | core |
| 3, 14, 16 | **Answers checked before launch:** the host approves every answer, and the assistant says "I'll ask the host" instead of guessing | 5 | 2 | core |
| 2 | **Works before guests reach Booking messages:** a QR card in the apartment plus a link inside the host's existing Booking/Airbnb welcome message, so it adds to the free tools rather than replacing them | 3 | 1 | core |
| 6, 8, 17 | **A season pass, not a subscription:** €120 per property for May–Oct, extra properties +€60, nothing charged Nov–Apr | 5 | 1 | core (pricing.md) |
| 7 | No setup fee until 31 March | 4 | 2 | urgency |
| 5 | **A one-page GDPR data agreement** in Croatian and English: data stays in the EU, nothing kept beyond the conversation, Almissa named as processor | 5 | 2 | bonus 1 |
| 15 | **End-of-August report:** how many questions it answered, in which languages, at what hours | 4 | 1 | bonus 2 |
| 9, 4 | **"See it at a neighbour's":** the first 10 hosts get a free "Pioneer" plaque and agree to show it to one neighbour; named backup contact if the founder is unavailable | 4 | 1 | bonus 3 |
| 10 | Printed laminated card with the QR code *and* a short link, in 5 languages | 3 | 1 | in core |
| 11 | Hosts send changes by WhatsApp and they're done within 24h in season | 4 | 2 | in core |
| 18 | The host keeps the answer sheet (their content) as a PDF if they stop | 2 | 1 | in core |
| – | Integration with Rentlio/Smoobu | 4 | 5 | dropped for now (too costly to build) |
| – | Full money-back on the season | 3 | 3 | replaced by the guarantee below |

## 3. The stack

**Core: "Mirni Kolovoz" Season Pass.** Your routine guest questions answered at midnight in German, Polish and Italian, while you keep the personal conversations. We set it up face to face, you approve every answer, and anything it isn't sure of comes straight to your WhatsApp.

- **Bonus 1: GDPR agreement**, signed, data in the EU. (Answers the trust and legal objection.)
- **Bonus 2: "Your August in numbers" report.** (Answers "did it save me anything?")
- **Bonus 3: Pioneer host plaque** for the first 10 hosts, plus a named backup contact. (Answers "I need to see a neighbour use it first" and "what if you disappear?")

**Guarantee: "First 30 days or you don't pay."** If in the first 30 days of the season the assistant gives a guest a wrong answer that you reported to us and we didn't fix within 24 hours, or you simply don't feel it saved you time, you get the season pass refunded in full.
- Cost check (CFO tool): with variable costs of €3.10 per property-month, a refunded host costs Almissa about €3 of running cost plus the setup time. At a 20% claim rate on 30 properties, that's about 6 refunds × €120 = €720 of revenue not collected. That is affordable only because there is almost no cash outlay per host. The pre-season ads and printing (€550 in `numbers.json`) are the real cash at risk.

**Urgency (true):** setup without the fee until **31 March 2027**, and a maximum of **40 properties set up before 1 May**. That is the founder's realistic setup capacity at about 1–1.5 hours per property.

**Name:** "Mirni Kolovoz" Season Pass ("Quiet August").

## 4. Value equation (1–10, before → after)

| element | before (€35/mo pitch) | after | what moved it |
|---|---:|---:|---|
| Dream outcome | 6 | 7 | Framed as "quiet August, you keep the personal side", not "a robot answers your guests" |
| Perceived likelihood | 3 | 6 | Host-approved answers, the "I'll ask the host" rule, GDPR agreement, 30-day guarantee, a neighbour to see it at |
| Time to result | 7 | 7 | Unchanged (1–2 weeks) |
| Effort and sacrifice | 5 | 8 | Season pass instead of a subscription, no setup fee, one price for several properties, changes sent by WhatsApp |

## 5. Re-test

Re-ran a 20-host panel on the new pitch (`pitch.md`; the old pitch is in `pitch-v1.md`, the old panel in `panel-v1/`). Note: with n=20 the tool deals a different set of 20 hosts from the same customer profile, so this is a fresh sample, not the same people.

| | v1: €35/mo + €150 setup | v2: Mirni Kolovoz season pass |
|---|---:|---:|
| Buy rate | 2 / 40 (5%) | 1 / 20 (5%) |
| Pass because of **price** | 2 | 1 |
| Pass because of **need** ("Booking already does it", "I live next door") | 14 (35%) | 5 (25%) |
| Pass because of **trust** (wrong answer → bad review; one-person company) | 11 (28%) | 7 (35%) |
| Acceptable price range (€/month) | €8–€25 | €5–€20 |

**What moved:** price almost disappeared as a reason. GDPR came up less, and the hosts who did raise it questioned the agreement rather than asking for one. **What didn't move:** the buy rate. Trust is now the top reason. A refund doesn't fix a lost Booking score, and the only proof hosts accept is a host they know using it for a full season. Single-apartment hosts are a 0% segment in both runs: they live next door and the free Booking/Airbnb messages are enough for them.

**Verdict, plainly:** the problem is the market, not the offer. For most apartment hosts on this coast, a paid guest assistant solves a problem they don't feel, and no pitch fixes that before there is local social proof. The one buyer in each run was a host with several properties, or a villa owner who is abroad and overwhelmed in peak season. Those, plus the pre-booking WhatsApp gap for taxi and tour operators (`competitors.md`), are where to look next.

**Recommended changes carried forward:**
1. Sell the season pass only to hosts with **3 or more properties** and to **villa owners who live abroad**. Drop single-apartment hosts.
2. Get social proof before selling: **5 free Pioneer installs** in spring 2027 at hosts with good local reputations, in exchange for showing it to neighbours and an honest August report.
3. Lead the business with the **WhatsApp booking assistant for taxi, transfer, tour and boat operators** (€60/mo + €300 setup), where there is a real gap and a working reference (Taxi Omiš Almissa). Test that segment with `/founder-consumer` next.
