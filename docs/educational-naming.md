# Educational content naming

_Recorded 2026-07-12 from Michael's naming session. This is the naming
scheme for educational realities/decks in the store catalog._

## The pattern

For a Reigns-style structure:

- **Reality name = the world/setting.** Evokes a domain feel, not a topic
  label ("The Perimeter", not "Security").
- **Deck name = the specific pressure point inside it.** Hints at the
  tension the swipes are teaching, not the syllabus unit ("Zero Hour", not
  "Incident Response").

Because decks share a reality, one educational world can grow a whole
curriculum of decks over time — and series metadata can chain them.

## Security → "The Perimeter"

| Topic | Deck name | Core tension |
|---|---|---|
| Forensics | Chain of Custody | evidence integrity vs. speed (bag it now or keep investigating? contaminate the scene or lose the lead?) |
| Security Audit | Red Team Rising | findings vs. politics (report the vuln or protect the client relationship?) |
| Incident Response | Zero Hour | contain vs. investigate (pull the plug now or let the attacker keep talking so you can trace them?) |
| Social Engineering | The Con | trust vs. paranoia, played from the attacker's side |
| Cryptography | Cipher's Edge | usability vs. security trade-offs |
| Compliance | Checkbox Nation | doing it right vs. doing it fast enough to pass audit |

## Science → "The Method"

| Topic | Deck name | Core tension |
|---|---|---|
| Scientific Method | Null Hypothesis | rigor vs. publish-or-perish pressure |
| Research Ethics | Informed Consent | participant welfare vs. data quality |
| Peer Review | Reviewer 2 | gatekeeping vs. innovation |
| Climate Science | The Thaw | uncertainty communication vs. urgency |
| Clinical Trials | Cold Chain | speed to market vs. safety |

## Business → "The Ledger"

| Topic | Deck name | Core tension |
|---|---|---|
| Startups | Runway | growth vs. burn rate |
| Negotiation | The Table | win-win vs. leverage |
| Management | One-on-One | candor vs. morale |
| Marketing/Growth | The Funnel | conversion vs. dark patterns |
| Corporate Ethics | The Fine Print | shareholder value vs. stakeholder harm |

## Future Reality concepts

| Domain | Reality name | Flavor |
|---|---|---|
| Medicine | The Ward | triage, bedside manner vs. protocol |
| Law | The Bench | justice vs. procedure |
| AI/Tech Ethics | The Black Box | capability vs. alignment |
| Journalism | The Deadline | truth vs. speed to publish |
| Diplomacy | The Long Table | principle vs. pragmatism |

## How the shipped catalog (2026-07-12) maps

The three educational realities shipped before this scheme existed:

- `edu-zero-day` "Zero Day: Breach Protocol" → under this scheme it becomes
  reality **The Perimeter** with deck **Zero Hour** (its content is exactly
  the incident-response arc: phishing → lateral movement → ransomware →
  aftermath). Rename when the Cybersecurity art set lands and the art
  rebind happens anyway.
- `edu-founders-gambit` "The Founder's Gambit" → reality **The Ledger**,
  deck **Runway** (content already is growth-vs-burn-rate).
- `edu-merge-conflict` "Merge Conflict" → no slot in the scheme yet;
  suggest a Software/Engineering reality (e.g. **The Stack**?) with Merge
  Conflict as its first deck. TBD.

Renames are edits to `swipeverse-store/catalog/realities.json` (id stays,
name/description change) or spec edits in
`scripts/generate-store-catalog.mjs` before regenerating. New decks within
an existing educational reality: generate as bare decks and either embed
(one deck per reality entry) or publish in `decks.json` — the per-reality
curriculum model may want a small catalog-shape rethink (multiple decks per
reality) before it scales.
