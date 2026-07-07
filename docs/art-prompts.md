# Card Art Prompt Sheet

Prompts for the full themed art set: 9 archetype scenes × 3 realities, a base
(neutral) set for community/custom realities, card backs, and the missing
space badge set.

## Rules for consistency (read first)

1. **Same suffix on every scene prompt** (this is what keeps 30+ images
   looking like one game):

   > …, 16-bit pixel art, flat colors with subtle texture, landscape 3:2
   > aspect ratio, moody two-tone palette with a single accent color, no
   > text, no borders, no UI

2. **Same tool, same settings, same session** where possible. If the tool
   supports seeds or style references, reuse them within a reality's set.
3. Generate 2–4 candidates per prompt and pick for *coherence with the set*,
   not for the best individual image.
4. **File naming** — drop finished images here (any size; they get processed):

   ```
   art-drops/base/<archetype>.png        # neutral set (fallback)
   art-drops/cyberpunk/<archetype>.png
   art-drops/mystical/<archetype>.png
   art-drops/space/<archetype>.png
   art-drops/backs/<realityId>.png       # card backs (portrait)
   art-drops/badges/space/<stat>.png     # fleet, credits, relations, data
   ```

   Archetype names: `petitioner, crisis, opportunity, faction, advisor,
   chain, judgement, gamble, terminal`.

## Reality palette lines (prepend to each themed prompt)

- **cyberpunk**: "Neon-noir cyberpunk scene: deep indigo and charcoal with hot
  pink and cyan accents, rain-slick streets, holograms, cables, neon signage."
- **mystical**: "Medieval fantasy scene: warm umber and parchment gold with
  deep purple accents, torchlight, stone walls, banners, arcane glyphs."
- **space**: "Cold sci-fi scene: navy and steel blue with pale cyan accents,
  starfields, hull plating, glowing consoles, distant nebulae."

## Scene prompts (9 archetypes × 3 realities)

### petitioner — someone asks you for something
- **cyberpunk**: A lone figure in a worn jacket stands facing the viewer under a flickering neon sign, open hands extended in appeal, rain falling around them.
- **mystical**: A peasant kneels at the foot of the throne steps, open hands raised in appeal, torchlight casting long shadows.
- **space**: A junior officer stands on the command deck facing the viewer, palms open in appeal, a starfield through the viewport behind.

### crisis — something bad happens to you
- **cyberpunk**: A city block in blackout, one megatower burning, red emergency glow on wet streets, tiny figures fleeing.
- **mystical**: A village burning at night, villagers fleeing across a field, a dragon silhouette crossing the moon.
- **space**: A station module venting atmosphere into space, emergency red lighting, debris drifting past the viewport.

### opportunity — a windfall or offer
- **cyberpunk**: An open briefcase glowing with credit chips in a dark alley, a gloved hand presenting it.
- **mystical**: An open treasure chest spilling golden light in a torchlit vault.
- **space**: A cargo bay door opening onto a glowing alien artifact in a crate, cool light flooding out.

### faction — a power bloc acts
- **cyberpunk**: Three corporate executives silhouetted before a giant glowing corporate logo, viewed from below.
- **mystical**: Three armored knights shoulder to shoulder beneath a large heraldic banner, viewed from below.
- **space**: Three admirals silhouetted before a holographic fleet insignia, viewed from below.

### advisor — information or a warning
- **cyberpunk**: A hacker in profile leaning in to whisper, data streams reflected in their visor, dim screens behind.
- **mystical**: A hooded sage in profile whispering, one hand raised beside their mouth, a sealed scroll under the other arm, candlelit.
- **space**: A translucent AI hologram head in profile advising a shadowed officer, console light from below.

### chain — part of a multi-card storyline
- **cyberpunk**: A figure seen from behind at a junction of three neon-lit alleys, each glowing a different color.
- **mystical**: A traveler seen from behind at a forked forest road, ancient waystones marking each path.
- **space**: A small ship approaching a jump-gate junction, three glowing route beacons diverging ahead.

### judgement — two parties in dispute, you pick a side
- **cyberpunk**: Two rival gang leaders facing each other across a table, arguing, the viewer's seat implied between them.
- **mystical**: Two nobles facing each other in heated argument before the throne, seen from the throne's point of view.
- **space**: Two alien delegates facing off across a council table, translators glowing, the viewer between them.

### gamble — uncertain outcome
- **cyberpunk**: Holographic dice tumbling mid-air above an outstretched cybernetic palm in a neon gambling den.
- **mystical**: Bone dice frozen mid-tumble above a tavern table, coins scattered, candlelight.
- **space**: Glowing chance-cubes floating in zero gravity above an outstretched gloved hand.

### terminal — endings: death, collapse, coup
- **cyberpunk**: A shattered neon corporate crown sign sparking in the rain on a dark street.
- **mystical**: A cracked crown lying on stone steps in the rain, dark liquid pooling beneath, one shaft of cold light.
- **space**: A cracked command helmet drifting among debris, a dim red emergency glow fading behind it.

## Base (neutral) set — fallback for community/custom realities

Already have: petitioner ×3, crisis, opportunity, judgement, chain (the
current bundled scenes). Still needed, in the *original* neutral style:

- **faction**: A group of three imposing figures standing shoulder to shoulder beneath a large banner, viewed from below, unified and faceless.
- **advisor**: A hooded figure in profile leaning close to whisper, one hand raised beside their mouth, a sealed scroll under the other arm, candlelit.
- **gamble**: Two oversized dice tumbling mid-air above an outstretched open palm, coins scattered and frozen mid-bounce, dramatic single light source.
- **terminal**: A cracked crown lying on stone steps in rain, dark spilled liquid pooling beneath it, a single shaft of cold light.

## Card backs (one per reality — portrait)

Suffix for backs: "…, 16-bit pixel art, ornate symmetrical card-back pattern,
portrait 3:4 aspect ratio, dark background, no text"

- **cyberpunk**: A symmetrical circuit-board mandala with a hot pink diamond at the center, cyan trace lines.
- **mystical**: A symmetrical arcane sigil with a gold diamond at the center, purple knotwork border.
- **space**: A symmetrical star-chart rosette with a pale cyan diamond at the center, thin orbit rings.

## Space badge set (4 stat icons)

Suffix for badges: "…, small pixel-art icon of a single object, centered,
transparent background, chunky 32x32 sprite style, bold dark outline"
(match the look of the existing treasury/population badge icons)

- **fleet** (Power): A compact pixel starship viewed at three-quarter angle.
- **credits** (Wealth): A short stack of hexagonal glowing credit chips.
- **relations** (People): A human hand and an alien hand clasped.
- **data** (Knowledge): A glowing crystalline data shard with etched glyphs.

## What happens after you drop the files

Claude processes `art-drops/` into `public/cards/` (resize/compress to webp),
extends `CARD_ART` to a per-reality lookup with the base set as fallback,
wires backs into the card stack / deck thumbnails, and adds the space badges
alongside the existing two badge sets. The `art-drops/` folder is gitignored;
only processed assets ship.
