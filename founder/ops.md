# Operations: how Almissa Digital actually runs

Rules and prices change, so confirm each item with the authority or supplier. This is not legal or tax advice.

## 1. The daily cycle

**In season (May–October)** (★ = the client or guest sees it)
1. 08:00: check the overnight "forwarded to host" log for every client. Any question the assistant couldn't answer is a gap. Add the answer the same day, after the client approves it.
2. 08:30: send operators their WhatsApp booking summaries, if not automatic ★
3. Morning: process client change requests sent by WhatsApp (new check-in time, Wi-Fi password) ★. **Within 24 hours** (the promise in `offer.md`).
4. Midday: 1–2 sales or setup visits in person ★
5. Afternoon: setups. About 1–1.5 hours per property: collect the facts, write the answers, the client approves them, print the QR card, test in DE/PL/IT/EN ★
6. 21:00: a 10-minute check of the error log and uptime
7. Fridays: weekly numbers (see `launch.md`)

**Off season (November–April):** sales visits (Feb–Mar), Pioneer installs, website and automation projects, the end-of-season reports ★, renewals in March ★.

## 2. Suppliers

| input (from `numbers.json`) | options | public price | notes |
|---|---|---|---|
| WhatsApp API number per operator client | 360dialog (partner per-number plans); alternatives: Twilio, Meta Cloud API direct | About €15–€49 per number per month depending on plan and source ([360dialog partner docs](https://docs.360dialog.com/partner/get-started/pricing)); Meta message fees on top ([Meta](https://developers.facebook.com/documentation/business-messaging/whatsapp/pricing)) | **Get a quote.** This is the biggest variable cost for the booking assistant. Going direct to Meta's Cloud API avoids the provider fee but costs build time. |
| AI model usage | Anthropic API, OpenAI API | Published per-token prices on their pricing pages | At the volumes in `numbers.json` (a few hundred messages per client per month) the €1.50–€5 estimates look generous, but measure the first month |
| Guest-assistant chat page hosting | Any static host plus one small server function | Free to about €20/month in total | Shared across all clients |
| QR cards and stands | Local print shops in Omiš/Split, or online printers | Get 2 quotes for 50 laminated A6 cards plus acrylic stands | The `numbers.json` estimate is €150 |
| Bookkeeping, invoicing, fiscalisation | Croatian invoicing apps for paušalists (several, e.g. ones listed by [fiskalopedija](https://fiskalopedija.hr/baza-znanja/pausalni-obrt) / [fiskai](https://www.fiskai.hr/vodic/pausalni-obrt/)) | Compare their published prices | Invoices must follow Croatian rules (see licences) |

**Open quotes to get:** 360dialog (or Twilio) per-number price, the print shop, an accountant's fee. When they arrive, update `numbers.json` and re-run the CFO.

## 3. People

One person, the founder. No wages are assumed. `cfo.md` shows year 1 doesn't pay a salary.

| week | sales visits | setups | support | projects | total hours |
|---|---:|---:|---:|---:|---:|
| Feb–Mar (selling) | 15 h | 8 h | 1 h | 6 h | ~30 |
| Late April (setup crunch, up to 40 properties) | 4 h | 30 h | 2 h | 0 | ~36 |
| July–August peak (20 properties + 8 operators) | 2 h | 2 h | 8 h | 4 h | ~16, but **on call daily** |
| November–January | 0 | 0 | 0.5 h | as sold | low |

**Capacity:** about 40 properties set up before 1 May (the cap in the offer). In peak season, one person can support about 60 properties plus 10 operators, if change requests stay under about 2 per client per month. **The founder is a single point of failure.** See the risk register and the named backup in `offer.md`: agree a backup person (a technically able friend or a local freelancer) with written instructions and access to the admin panel.

## 4. Routines (one page each)

**A. Setting up a new property**
1. Visit: take a photo of the house rules, Wi-Fi, parking, check-in method and nearby tips. Agree on what the assistant must **never** answer (prices, refunds, damage).
2. Write the answers in the table, in Croatian first.
3. The client approves every line, signed in WhatsApp ("Odobreno").
4. Generate the translations, then spot-check DE and PL with a native speaker or a second tool.
5. Test 20 questions, including 5 it should forward. All 5 must reach the client's WhatsApp.
6. Print and laminate the QR card with the host's name and WhatsApp number on it.
7. Sign the GDPR data-processing agreement.
8. Send the confirmation message (`brand.md`, touchpoint 3).

**B. A wrong answer or a complaint**
1. Reply to the client within 1 hour in season: thank them, say what happened.
2. Fix the answer and add it to "never answer, always forward" if it was risky.
3. Retest the same question in all languages.
4. Log it: date, question, wrong answer, fix.
5. Offer the 30-day refund if they're within the window. Don't argue.

**C. Weekly in season (Friday)**
1. Review the forward log: which questions forwarded most? Add answers, with approval.
2. Check uptime and errors.
3. Update the client count and the numbers in `launch.md`.
4. Send one "question of the week" post (anonymised, with permission).

**D. End of season (1 November)**
1. Send each client their "Your August in numbers" report.
2. Pause the assistants. Offer a winter mode for clients who rent all year.
3. March: send the renewal offer with the pre-season deadline.

## 5. Tools (smallest stack)

| job | tool |
|---|---|
| Client chat page and AI | Self-built on an AI API (as for the existing demos) |
| WhatsApp | WhatsApp Business app for the founder; WhatsApp API through a provider for operator clients |
| Answers database | One spreadsheet per client (owners can read it) |
| Invoicing and fiscalisation | A Croatian invoicing app for paušalists |
| Bookkeeping | An accountant (quote needed) |
| Payments | Bank transfer (most Croatian B2B); card link optional |

## 6. Licences, permits and insurance (checklist)

- [ ] **Register a sole-trader business (obrt)** through e-Obrt / START (https://www.start.gov.hr/), choosing the activity codes for IT and computer-programming services.
- [ ] **Paušalni (lump-sum) taxation:** check eligibility and the revenue limit with the Tax Administration (https://porezna-uprava.gov.hr/en/obrtnici-pausalisti/4564). Contributions are about €290.98/month in 2026 if this is the main activity, or **yearly if it's a second activity next to a job** ([fiskai](https://www.fiskai.hr/alati/kalkulator-doprinosa/)).
- [ ] **OIB and a business bank account.**
- [ ] **Invoicing and fiscalisation rules** (including the e-invoicing obligations being rolled out in Croatia). Confirm with an accountant which apply to your obrt.
- [ ] **GDPR:** a data-processing agreement template (Almissa as processor, the host as controller), a record of processing, and the AI and WhatsApp providers as sub-processors with EU data handling where possible. Guidance: Croatia's data protection agency AZOP (https://azop.hr/).
- [ ] **AI transparency:** tell guests clearly that they are talking to an AI assistant (the EU AI Act transparency duties for chatbots). Put it on the QR card and as the first line of the chat.
- [ ] **Professional liability insurance:** optional, but worth a quote given the "wrong answer" risk.

## 7. Risk register

| # | risk | likelihood | impact | plan |
|---|---|---|---|---|
| 1 | The assistant gives a guest a wrong answer, leading to a bad review | Medium | High | Client approves every answer; risky topics always forwarded; daily log review; 24-hour fix; 30-day refund |
| 2 | The founder is ill or unreachable in August | Medium | High | Named backup person with an admin login and routine B; status message for clients |
| 3 | The AI or WhatsApp provider goes down or raises its price | Medium | Medium | The "forward to host" fallback works without the AI; keep a second AI provider ready; pass number fees through (`cfo.md`) |
| 4 | Too few sign-ups by 15 March | **High** (panel 5%) | High | Concentrate on operators and multi-property hosts; keep projects (websites) as cash flow; see `launch.md` |
| 5 | Booking.com/Airbnb improve their free AI replies | High | Medium | Position on the local, in-person setup and the pre-booking WhatsApp gap |
| 6 | Rentlio or a local freelancer copies the offer | Medium | Medium | Reference clients, relationships, speed |
| 7 | A GDPR complaint | Low | High | Signed data-processing agreements, minimal data, EU processing, AI disclosure |
| 8 | Setup crunch in April (more than 40 properties) | Low | Medium | Hard cap of 40; waitlist |
| 9 | Clients don't renew in year 2 | Medium | High | The August report proves the value; renewal offer in March |
| 10 | Name confusion with the Almissa campsite company | Medium | Low–Medium | Always "Almissa Digital"; trademark check (`brand.md`) |
