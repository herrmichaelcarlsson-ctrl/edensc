
# Build-plan: Compare, GearScore, Community Browser, Risk UI m.m.

Implementeras i en runda, grupperat per område. Befintlig kod återanvänds — inget byggs om i onödan.

## 1. Item Picker — sök på stats
**Fil:** `src/components/builder/ItemPickerDialog.tsx`

- Lägg till en andra rad med `MultiSelect`-chips ovanför listan: alla effekter från `EFFECT_OPTIONS` grupperade (Stats / Resists / Skills / ToA).
- Filterlogik: ett item matchar om varje vald effect-id finns i `item.effects[]`.
- Sortera matchande items efter summan av valda effect-värden (störst först).
- Behåll fritextsökning; visa antal aktiva filter.
- "Clear filters"-knapp.

## 2. GearScore breakdown-panel i builder
**Filer:** ny `src/components/builder/GearScorePanel.tsx`, edit `src/routes/builder.tsx`

- Använd `calcGearScore(agg)` från `src/lib/daoc/formulas.ts` (finns redan, default config).
- Liten panel ovanför `SuggestionsPanel`:
  ```
  Utility   245.3
  ToA       128.0
  Charges    35.0
  Waste    − 12.5
  ──────────────
  GearScore 395.8
  ```
- Färgade rader (waste = röd, total = primary). Tooltip per rad med kort förklaring.
- Senare: hämta `formula_config` från DB; v1 använder DEFAULT_FORMULAS.

## 3. Spellcraft Risk/Overcharge UI
**Fil:** `src/components/builder/SpellcraftDialog.tsx`

- Importera `calcImbueUsed`, `calcOvercharge`, `calcFailRisk`, `riskLevel`, `riskLabel` från `formulas.ts`.
- Räkna `imbueUsed` med formel-versionen (highest + rest/2) — uppdatera även `inspectGems` att exponera detta värde, eller beräkna i dialogen från `status.gems.map(g=>g.cost)`.
- Lägg till en risk-meter under status-headern:
  - Horisontell bar med 5 zoner (Safe → Extreme), markör vid aktuell overcharge.
  - Text: `Overcharge: 1.5pt · Risk: 4.6% · Moderate`.
- Färg: grön → gul → orange → röd → mörkröd.

## 4. Resist Hole / Missing Stats panel
**Fil:** ny `src/components/builder/ResistHolePanel.tsx`, edit `builder.tsx`

- Använd `detectResistHoles(agg)` från formulas.ts.
- Visa lista över resists under cap med diff (t.ex. `Body −12%`).
- Render bredvid SuggestionsPanel i höger sidopanel (collapsible section).

## 5. Smart Compare Mode (ny route)
**Filer:** ny `src/routes/compare.tsx`, länk i builder-header & home

- Ladda 2–3 templates via `?ids=uuid1,uuid2` query param från `saved_templates`.
- Picker-UI: dropdown per kolumn som listar publika + sparade templates (filtrera på `is_public=true` + ev. owner).
- För varje template:
  - Återanvänd `aggregate()` med items hämtade från `items`-tabellen efter slot-id.
  - Beräkna `calcGearScore`, `calcImbueUsed` totalt över alla slots.
- Layout: vänster kolumn = stat-namn, en kolumn per template.
- Diff-highlight: bästa värde grönt, sämsta rött (för stats: högre=bättre; för waste: lägre=bättre).
- Sektioner: Stats, Resists, Skills, ToA, GearScore breakdown, Imbue used per slot.

## 6. Community Item Browser (ny route)
**Filer:** ny `src/routes/items.browse.tsx`, länk i top-nav

- Query `community_items` där `approved = true`.
- Filter: realm, slot, class_restriction, sökterm på name + effekt-stats (samma chip-UI som item picker).
- Item-kort visar effekter, källa (`origin`), upvotes.
- "Use in build"-knapp:
  - Om en byggsession finns i localStorage med matchande slot → spara item till `itemsCache` + `slots[slotKey]` och navigera till `/builder`.
  - Annars: kopiera item-data till en pending-buffert som builder läser vid mount.

## 7. Race-bonusar påverkar caps
**Filer:** `src/lib/daoc/storage.ts`, `src/lib/daoc/aggregate.ts`, `src/routes/index.tsx`, `src/routes/builder.tsx`

- Persistera `race` i `loadState/saveState` (lägg till fält i state-typen).
- `aggregate()` tar valbar `race?: RaceDef`. Lägg på `innateResists` som extra "current" på relevanta resist-keys, och addera ev. `baseStats` inte till caps utan visa separat (Race base) i `StatsPanel`.
- `index.tsx` sparar valt race till storage innan navigate till /builder.
- Builder läser race och passerar till aggregate.

## 8. Total templates counter på home
**Fil:** `src/routes/index.tsx`

- Läs `platform_stats` rad `id='total_templates'` med supabase select i en useEffect (eller i loader).
- Visa `<N> templates built` i hero-sektionen.
- Bekräfta att `bump_template_counter` trigger körs på `saved_templates` insert (skapas via migration om saknas).

## 9. Admin: pending community items
**Fil:** `src/routes/admin.formulas.tsx` → splitta till tabbar, eller ny `src/routes/admin.items.tsx`

- Lägg ny migration: `community_items.approved` default `false` (idag default `true`). Existerande rader behåller sina värden.
- Admin-sida listar `approved=false`-items med Approve/Reject knappar (update / delete).
- Skydda via `useAuth` + `has_role`-check (samma mönster som admin.formulas).

## 10. Migrationer
- `community_items.approved` default ändras till `false`.
- Säkerställ trigger `AFTER INSERT ON saved_templates EXECUTE bump_template_counter` finns; om inte → skapa.
- Seed `platform_stats` rad `('total_templates', 0)` om saknas.

## Tekniska anteckningar

- Compare-route hämtar items i batch: samla unika ids från alla 2–3 templates' `slots`, en `.in("id", ids)`-query.
- Stat-filter i picker: matchning sker client-side (items är redan i minnet, max 2000/rad).
- GearScore-panelen läser inte DB i v1; admin-overrides från `formula_config` blir uppgift senare.
- Inga ändringar i RLS behövs förutom `community_items.approved`-default (befintliga policies hanterar redan publik läsning av approved + admin-update/delete).

## Ordning för implementation

1. Migration (counter trigger, approved default)
2. Item picker stat-sök
3. GearScore + Resist hole panels
4. Spellcraft risk-meter
5. Race wiring
6. Compare-routen
7. Community item browser + "Use in build"
8. Admin pending-queue + total counter
