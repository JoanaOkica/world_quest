# Monetization

> All numbers below are **illustrative assumptions to pressure-test**, not forecasts.
> Currency: EUR. The point is the *shape* of the model and which levers matter.

## Principle: monetize the edges, never the core loop

The integrity of the competition **is** the product. If anyone can pay for points,
territory, or a stronger claim, every ranking becomes suspect and the social game dies.
So every model here sells something *around* the game — insight, cosmetics, convenience,
keepsakes, aligned commerce — and never fairness.

**Hard line:** no pay-to-win, no banner/interstitial ads, no selling location data
(GDPR + trust), no airline sponsorships (tonally fatal for a green-travel app).

## Tiers

### Free (the whole game)
Log trips, claim territory, friends leaderboard, map coloring, live-capture proof, basic
stats and recent history, one standard map theme. The core loop is never gated — you need
density for the social game to be fun, so free has to be genuinely complete.

### terra+ — subscription (the workhorse)
Sells **depth and cosmetics, never a competitive edge.**
- Full history + map replay / time-lapse of your conquest
- Advanced stats: green-km, CO₂ avoided, streaks, per-region breakdowns
- Custom map themes, territory colors, badge/flag styling
- Larger / unlimited private leagues, trip-planning tools
- Ad-free (if any sponsored content exists) + a discount on prints
- **Price hypothesis:** €3.99/mo or €29.99/yr (annual ≈ 7 months, to push annual).
  Anchor to test against; Strava sits far higher (~€12/mo), Been is one-time.

### One-time / à la carte
- **Physical posters** of your year's conquered territory. Print-on-demand, no inventory.
  Price ~€29.99, COGS ~€12 → ~€18 margin. High emotional pull; *adds* to the experience.
- Optional cosmetic packs (if not fully bundled into terra+).

### Affiliate (can *improve* UX)
Commission on train / bus / ferry / hostel bookings made through the app (Trainline, Omio,
BlaBlaCar-style). You're helping people take the greener option they already wanted —
monetizing real intent. Fits the interrailer wedge perfectly.

### Partnerships / sponsored challenges → B2B later
Opt-in curated challenges from rail operators, Interrail/Eurail, tourism boards, green
brands ("3 train trips this month → badge + discount"). Reads as content, not an ad. Later
lane: company / school "green league" subscriptions (where Pawprint & WheelCoin found real
money).

## Illustrative revenue model

**Assumptions (tune these):**
- Free→paid conversion: **3%** (realistic range 2–5%)
- Subscription gross per payer/yr: **€30**; platform cut ~20% → **~€24 net**
- Poster attach: **2%** of MAU/yr × **€18** margin
- Affiliate: **8%** of MAU book once/yr × **€3** avg commission
- Partnerships: excluded from base (treat as upside)

| Line (annual, net)        | 10,000 MAU | 100,000 MAU |
|---------------------------|-----------:|------------:|
| Subscriptions (3% × €24)  |    €7,200  |    €72,000  |
| Posters (2% × €18)        |    €3,600  |    €36,000  |
| Affiliate (8% × €3)       |    €2,400  |    €24,000  |
| **Base total**            | **€13,200**| **€132,000**|
| Partnerships              |     upside |      upside |

**What the model tells you:**
1. Subscriptions only matter at scale — real income needs 100k+ MAU. At 10k, terra+ is
   ~€600/mo.
2. Early on, **posters + affiliate make up ~45% of revenue** — so blend the models, don't
   bet the business on subscriptions. This is why the poster ships early.
3. Everything is downstream of MAU. Distribution/retention is the actual bottleneck, not
   pricing.

## Costs that scale (fold these in before believing any total)

- **App-store cut:** Apple/Google take 30% year 1, 15% after, on in-app subscriptions.
  Already baked into the ~20% blended haircut above — but it's the biggest silent tax on
  subs. Web-based billing can reduce it where allowed.
- **Mapbox:** billed by map loads / MAU — can become a real monthly cost at scale. Cache
  tiles and cap loads.
- **SMS verification (Twilio ~€0.07 each):** a per-signup cost, and your main anti-spam
  gate — watch it during viral spikes.
- **Supabase, payment processing (~3%), print fulfillment.** Manageable, but real.

## The three levers that move everything

1. **MAU** (top of funnel) — biggest lever by far.
2. **Conversion %** — small absolute moves, big revenue swing.
3. **ARPPU** — price and attach rates.
Model any scenario by changing just these three.

## Sequencing (pre-launch → scale)

1. **Launch free.** Don't gate the loop; buy density first.
2. **Ship the poster early** — cheap to build, high margin, emotionally on-brand.
3. **Add terra+** once you have engaged users and features worth paying for.
4. **Affiliate** once traffic is worth a partner's attention.
5. **Partnerships / B2B green-leagues** as a separate, later lane.

## Reality check

Freemium conversion is usually low single digits, so don't model 10%. Being in the EU
turns "sell data" from a revenue idea into a liability. And no model earns anything until
retention is solved — a competitive social app is worthless until your friends are on it.
