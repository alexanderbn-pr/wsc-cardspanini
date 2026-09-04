# Exploration: Los jugadores/cromos no están ordenados correctamente por sección

## Current State

The file `scripts/reformat-checklist.ts` converts `checklist.txt` (3-column parallel layout from a Panini La Liga checklist PDF) into per-team blocks. The function `reformatChecklist()` maintains per-column context to track which team each column is showing. **The output is severely corrupted**: players appear under wrong teams, multiple teams are missing players, and special sections are incomplete.

## Affected Areas

- `scripts/reformat-checklist.ts` — **Primary bug location**. The `reformatChecklist()` function has multiple issues in its column-context tracking and fallback logic.
- `scripts/reformat-checklist.test.ts` — Existing tests don't cover the multi-column context tracking or end-to-end output correctness.
- `checklist.txt` — Input file. 3-column layout with team headers appearing at different positions per column.
- `checklist-reformatted.txt` — **Corrupted output** showing the bugs.

## Data Model

```typescript
interface PlayerEntry {
  number: string;       // "1", "9A", "13BIS", "UF1", "K1"
  name: string;         // Player name
  position: string;     // "portero", "defensa", "medio", "delantero", "entrenador"
  secondEdition?: boolean;
}

interface TeamBlock { name: string; players: PlayerEntry[]; }
interface SpecialSection { name: string; players: PlayerEntry[]; }
```

Teams: 20 La Liga teams defined in `TEAM_NAMES` constant.
Special sections: 8 defined in `SPECIAL_SECTIONS` constant.

## Sorting Logic (Current)

The `reformatChecklist()` function works in two passes per line:

1. **First pass**: Scan all 3 columns for team/section headers → update `colCtx[0..2]`
2. **Second pass**: Parse players → assign to `colCtx[col]`, falling back to `colCtx[0]` if null

```
colCtx = [null, null, null]  // per-column context
for each line:
  pass 1: detect headers → set colCtx[col]
  pass 2: parse players → assign to colCtx[col] or fallback to colCtx[0]
```

## Potential Root Causes (6 bugs identified)

### Bug 1: CRITICAL — Incorrect fallback to col1 context

**Location**: `reformatChecklist()` lines 240-244

```typescript
let ctx = colCtx[col];
if (!ctx && col > 0) {
  ctx = colCtx[0]; // Fallback: col1's context ← THIS IS WRONG
}
```

**Problem**: Col2's first team is ATLÉTICO DE MADRID, col3's first team is REAL BETIS. But the text extraction loses their headers. When col2/col3 have no context, the fallback assigns their players to col1's team (DEPORTIVO ALAVÉS).

**Impact**: First ~22 lines of col2 (all ATLÉTICO players) and first ~18 lines of col3 (all BETIS players) are incorrectly assigned to DEPORTIVO ALAVÉS.

**Evidence from output**:
```
DEPORTIVO ALAVÉS
2   Cholo Simeone    entrenador    ← ATLÉTICO's coach!
5A  Aitor Ruibal     defensa       ← BETIS player!
3   Oblak             portero       ← ATLÉTICO player!
```

### Bug 2: Missing "1 Escudo" entries for ALL teams

**Location**: `parsePlayerEntry()` regex at line 95

```typescript
const regex = /^\s*([A-Z]*\d+[A-Z]*(?:BIS)?)\s+(.+?)\s+(portero|defensa|medio|delantero|entrenador)(?:\s+2ªed)?\s*$/;
```

**Problem**: "1 Escudo" has no position word. The regex requires one of: portero, defensa, medio, delantero, entrenador. So ALL "1 Escudo" entries (team badges) are silently skipped.

**Impact**: Every team is missing its #1 entry.

### Bug 3: VILLARREAL players leak into RACING DE SANTANDER

**Location**: Context tracking failure for later columns.

**Evidence from output**:
```
RACING DE SANTANDER
...
6A  Pau Navarro     defensa    ← VILLARREAL player!
6B  Logan Costa     defensa    ← VILLARREAL player!
7A  Foyth           defensa    ← VILLARREAL player!
...18 VILLARREAL players total!
```

### Bug 4: DEPORTIVO and RCD ESPANYOL missing middle players

**Location**: Context tracking gap between visible headers.

**Evidence from output**:
```
DEPORTIVO
...6 Loureiro defensa
18  Iván Romero  delantero    ← JUMP from 6 to 18! Players 7-17 missing!

RCD ESPANYOL
...11 Pol Lozano medio
19  Joaquín delantero          ← JUMP from 11 to 19! Players 12-18 missing!
```

### Bug 5: EXTRA STICKER sections missing entirely

**Location**: `isSpecialSection()` exact match + text extraction splitting.

The text extraction splits "EXTRA STICKER BRONCE" across multiple lines:
```
Extra    Lamine Yamal (Barcelona)
Sticker  delantero
```

`isSpecialSection` checks `trimmed === section` which fails because the header is never a single complete string.

### Bug 6: SEVILLA, DRAFT 23, DRAFT 23 KROMIX, LALIGA FANTASY severely incomplete

**Cause**: Combination of Bugs 1 and 3 — context tracking failures cause entries to be assigned to wrong teams.

**Evidence**:
```
SEVILLA (should have 20+ entries, has only 4):
2  Luis García     entrenador
3  Vlachodimos     portero
5  Carmona         defensa
12 Pedri (Barcelona) medio  ← LALIGA FANTASY entry!

VILLARREAL (should have 20 entries, has 6 + 6 KROMIX):
K10 Huijsen (Real Madrid) defensa  ← DRAFT 23 KROMIX!
```

## Approaches

### Approach A: Remove fallback + pre-scan for missing headers

**Pros**: Simple, no false assignments
**Cons**: Players before first header are lost. Requires pre-scanning to identify missing headers.

**Effort**: Medium

### Approach B: Switch to PDF-based parsing with X/Y coordinates

**Pros**: Most accurate — uses the same approach as `parse-checklist.ts` which handles columns correctly
**Cons**: Requires PDF dependency, more complex

**Effort**: High

### Approach C: Improved text-based approach with header inference

1. Remove the col1 fallback entirely
2. Pre-scan all lines to build a map of known player→team associations (from later headers)
3. Use position in column + known team sequence to infer missing headers
4. Fix `parsePlayerEntry` to handle "1 Escudo"
5. Fix `isSpecialSection` to handle split EXTRA STICKER headers

**Pros**: Works with text input, no PDF dependency, handles all edge cases
**Cons**: More complex logic, fragile if PDF layout changes

**Effort**: Medium-High

### Approach D: Hybrid — use parse-checklist.ts approach for the heavy lifting

Since `parse-checklist.ts` already handles the PDF with column-aware parsing, refactor to output the same format as reformat-checklist.ts.

**Pros**: Reuses existing working logic
**Cons**: Changes the pipeline, requires PDF file

**Effort**: Medium

## Recommendation

**Approach C (Improved text-based)** is the best balance:

1. **Remove the col1 fallback** — this is the root cause of most corruption
2. **Add a pre-scan phase** that identifies all team/section headers and their line positions across all columns
3. **Fix `parsePlayerEntry`** to handle "1 Escudo" (make position optional or add "escudo" as a valid position)
4. **Fix `isSpecialSection`** to handle partial/split EXTRA STICKER headers
5. **For players before their first header**: either skip them (and add a warning) or use a heuristic based on known team sequence

The fix should be testable against the existing checklist.txt with expected output verification.

## Risks

- The text extraction quality depends on the PDF parser — different PDF versions may produce different text layouts
- Header inference for missing headers is fragile
- The "1 Escudo" fix changes the data model (position becomes optional or a new value is added)
- End-to-end tests need a known-good expected output

## Ready for Proposal

**Yes** — the root cause is clearly identified (fallback logic + missing headers + regex gap). The fix is well-scoped to `reformat-checklist.ts` with test updates.
