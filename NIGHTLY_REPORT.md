# Nightly Report — 28.06. → 29.06.

## Aufgaben-Liste (Daniel-approved)
1. FCMS Backend Re-Investigation
2. Phase B UI (News/Status/Register)
3. Phase D Addon-Manager UI
4. Hyjal Sub-Zone Design-Spec
5. 4 Hyjal-Worldboss C++ Scaffold (S2-S5)
6. Memory final update

Progress wird unten live geschrieben.

---


## Task 4: Hyjal Sub-Zone Design-Spec ✅

- File: `projects/wow-server/hyjal-zones-spec.md` (~250 Zeilen)
- 5 Sub-Zones mit Lore-Themes, Phasing-Bitmask-Schema, Quest-IDs, Boss-Mechaniken (4 neue), NPC-IDs, Implementierungs-Reihenfolge
- **Daniel-Decisions offen:**
  1. Bot-Erlaubnis in Sub-Zones (Quests vs Worldbosse)
  2. Sub-Zone-Coords auf Map 1 (Daniels Map-Skizze?)
  3. Reise Sub-Zone-zu-Sub-Zone (Flugpunkte?)
  4. Schatten-Mount-Drop-Rate (5% vs 1%)
  5. Endgame-State nach Schatten-Kill (Title? Repeat-Raid?)
  6. Custom-Dungeon-Höhle Position (Vorschlag: S4)


## Task 5: Hyjal-Worldboss C++ Scaffold ✅ (Pyrelord) / 🚧 (3 weitere)

- File: `projects/wow-server/HyjalRaidScaling.cpp.draft` — Helper + 1 vollständig scaffolded Boss (Pyrelord Ashvein, 990500)
- `HyjalRaidScaling` namespace mit:
  - `ScaleParams` Struct (HP/DMG/Adds/Orbs/Loot per Raid-Size)
  - `ComputeFor(raidSize)` — Lookup-Table 10/15/20/25/30/35/40
  - `SnapshotRaidSize(killer)` — count alive Group-Members innerhalb 100y
  - `ApplyToBoss(creature, params)` — setzt MaxHealth + DamageModifier
  - `LockGroup/UnlockGroup/IsLocked` — anti-mid-fight-stacking (Set<groupId>)
- `BossPyrelordAshvein` — vollständig scaffolded mit JustEngagedWith/JustDied/EvadeMode/UpdateAI Hooks + Timer-Lifecycles für Ember-Cascade + Inferno-Roar
- **Noch zu scaffolden:** Velnara (S3), Voidcaller Mortheim (S4), Schatten des Smaragdtraums (S5 Final, 3-Phasen)
- **Noch fehlend:** Group::AddMember-Hook für Combat-Lock-Enforcement (braucht Custom GroupScript)
- **Noch fehlend:** Real Spell-IDs für Mechaniken (TODOs in UpdateAI)

