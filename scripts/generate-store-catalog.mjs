/**
 * Generates the store catalog content: one themed reality (with embedded deck)
 * per hosted art set, educational realities, and multi-part sagas.
 *
 * Usage:  ANTHROPIC_API_KEY=... node scripts/generate-store-catalog.mjs [id ...]
 *   - With no args: generates everything not already staged, then assembles.
 *   - With ids (reality ids or saga slugs): regenerates just those (delete the
 *     staged file to force), then assembles.
 *   - --assemble-only: skip generation, rebuild catalog files from staging.
 *
 * Staged decks land in scripts/store-out/ (one JSON per deck) so an
 * interrupted run resumes where it left off. The assemble step writes
 * ../swipeverse-store/catalog/{realities,decks}.json. Run the store
 * validator afterwards: node ../swipeverse-store/scripts/validate.mjs
 *
 * Mirrors the app's Story Director prompt (services/aiProvider.ts) and
 * validation (validateAndRepairDeck); every deck must pass the exact
 * winnable-AND-losable solver gate (deck-solver.mjs) before it is staged.
 */

import Anthropic from "@anthropic-ai/sdk";
import { writeFileSync, readFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { checkPlayable } from "./deck-solver.mjs";

const DECK_SIZE = 20;
const MAX_EFFECT = 50;
const STAT_NAMES = ["Power", "Wealth", "People", "Knowledge"];
const ARCHETYPES = ["petitioner", "crisis", "opportunity", "faction", "advisor", "chain", "judgement", "gamble", "terminal"];
const ART_BASE = "https://store.swipeverse.app/art";
const HERE = dirname(fileURLToPath(import.meta.url));
const STAGE_DIR = join(HERE, "store-out");
const CATALOG_DIR = join(HERE, "..", "..", "swipeverse-store", "catalog");
const CONCURRENCY = 4;

const ICON_TRIOS = {
    Cyber: { Power: "PowerIconCyber", Wealth: "WealthIconCyber", People: "PeopleIconCyber", Knowledge: "KnowledgeIconCyber" },
    Mystic: { Power: "PowerIconMystic", Wealth: "WealthIconMystic", People: "PeopleIconMystic", Knowledge: "KnowledgeIconMystic" },
    Space: { Power: "PowerIconSpace", Wealth: "WealthIconSpace", People: "PeopleIconSpace", Knowledge: "KnowledgeIconSpace" },
};

/**
 * One reality per hosted art set (category "game"), plus educational
 * realities (category "education"). `artSet` binds every generated card's
 * imageUrl to the matching archetype scene in that store art set.
 */
const REALITY_SPECS = [
    {
        id: "aviation", artSet: "aviation", name: "The Aerodrome", icons: "Cyber", category: "game",
        description: "Run a pioneer airline in the golden age of flight, where every route is a wager against weather, rivals and gravity.",
        statNames: { Power: "Command", Wealth: "Fuel & Funds", People: "Crew", Knowledge: "Navigation" },
        colors: { primary: "text-sky-400", secondary: "text-amber-300", background: "bg-gradient-to-br from-sky-950 via-slate-900 to-zinc-900", accent: "border-sky-400" },
        storyPrompt: "The player runs a struggling airline in the 1930s golden age of aviation: open-cockpit mail runs, record attempts, monsoon routes, and a government contract that could save or sink them. Rival airlines poach pilots, storms eat schedules, and every shortcut across the map is a gamble. Choices trade command authority, money and fuel, the loyalty of pilots and ground crew, and hard-won navigational knowledge.",
    },
    {
        id: "business", artSet: "business", name: "The Corner Office", icons: "Cyber", category: "game",
        description: "Claw your way to the top of a corporation where every ally is a rival waiting for you to slip.",
        statNames: { Power: "Influence", Wealth: "Capital", People: "Workforce", Knowledge: "Market Intel" },
        colors: { primary: "text-emerald-400", secondary: "text-slate-300", background: "bg-gradient-to-br from-slate-900 via-gray-900 to-emerald-950", accent: "border-emerald-400" },
        storyPrompt: "The player is a newly promoted executive at a corporation in the middle of a hostile takeover attempt. Board factions scheme, a whistleblower has documents, the union is restless, and a rival firm dangles a merger. Weave boardroom intrigue, market gambles and press leaks into choices that trade personal influence, company capital, workforce loyalty, and market intelligence.",
    },
    {
        id: "egypt", artSet: "egypt", name: "Sands of the Nile", icons: "Mystic", category: "game",
        description: "Rule as Pharaoh while the river, the priesthood and the gods themselves test your dynasty.",
        statNames: { Power: "Divine Authority", Wealth: "Grain Stores", People: "The People", Knowledge: "Temple Lore" },
        colors: { primary: "text-yellow-400", secondary: "text-orange-300", background: "bg-gradient-to-br from-amber-950 via-stone-900 to-yellow-950", accent: "border-yellow-400" },
        storyPrompt: "The player is a young Pharaoh in a year when the Nile flood fails. The priesthood of Amun demands greater tribute, tomb robbers stalk the necropolis, a Hittite envoy brings an offer wrapped in a threat, and the granaries are counted twice. Choices trade divine authority, grain and gold, the people's devotion, and secret temple knowledge.",
    },
    {
        id: "gothic", artSet: "gothic", name: "House of Ravenmoor", icons: "Mystic", category: "game",
        description: "Inherit a cursed estate whose debts are paid in secrets, and whose secrets are paid in blood.",
        statNames: { Power: "Dread", Wealth: "The Estate", People: "The Village", Knowledge: "The Occult" },
        colors: { primary: "text-purple-400", secondary: "text-red-400", background: "bg-gradient-to-br from-purple-950 via-gray-950 to-black", accent: "border-purple-400" },
        storyPrompt: "The player inherits Ravenmoor, a decaying gothic estate with sealed wings, a resentful village at its gates, and a family curse that is less metaphorical than the solicitor implied. Ghostly bargains, midnight visitors, and a crypt that should have stayed shut. Choices trade the fear you command, the estate's wealth, the villagers' tolerance, and forbidden occult knowledge.",
    },
    {
        id: "kingdom", artSet: "kingdom", name: "The Uneasy Crown", icons: "Mystic", category: "game",
        description: "Hold a medieval throne through famine, feuding lords and a war nobody can afford.",
        statNames: { Power: "The Crown", Wealth: "The Coffers", People: "The Subjects", Knowledge: "The Council" },
        colors: { primary: "text-amber-400", secondary: "text-red-300", background: "bg-gradient-to-br from-stone-900 via-red-950 to-stone-950", accent: "border-amber-400" },
        storyPrompt: "The player is a monarch two winters into a reign that began with a contested succession. Border barons test the crown's reach, the harvest is thin, a crusade demands levies, and the spymaster's reports contradict the chancellor's. Court intrigue, peasant petitions and open rebellion. Choices trade royal authority, treasury gold, the love of the subjects, and the counsel of dangerous advisors.",
    },
    {
        id: "medical", artSet: "medical", name: "Night Shift", icons: "Cyber", category: "game",
        description: "Keep a city hospital alive through an outbreak, a budget crisis and a board that smells liability.",
        statNames: { Power: "Authority", Wealth: "Funding", People: "Patients & Staff", Knowledge: "Research" },
        colors: { primary: "text-teal-400", secondary: "text-rose-300", background: "bg-gradient-to-br from-slate-900 via-teal-950 to-slate-950", accent: "border-teal-400" },
        storyPrompt: "The player is the new medical director of an underfunded city hospital as a novel infection starts filling the ER. Supply shortages, a nurses' strike brewing, an experimental treatment with thin evidence, journalists at the door, and a board that wants it all kept quiet. Choices trade administrative authority, funding, the trust of patients and staff, and medical research knowledge.",
    },
    {
        id: "military", artSet: "military", name: "The War Room", icons: "Cyber", category: "game",
        description: "Command a border war where the maps are wrong, the supplies are late and the politicians are watching.",
        statNames: { Power: "Command", Wealth: "Supplies", People: "Morale", Knowledge: "Intelligence" },
        colors: { primary: "text-lime-400", secondary: "text-stone-300", background: "bg-gradient-to-br from-stone-900 via-lime-950 to-zinc-950", accent: "border-lime-400" },
        storyPrompt: "The player is a general given command of a faltering border campaign. The enemy probes every night, a rival officer undermines orders, winter is closing the passes, and headquarters wants a victory for the newspapers. Reconnaissance, rationing, mutiny and sacrifice. Choices trade command authority, supplies and materiel, the morale of the troops, and battlefield intelligence.",
    },
    {
        id: "mythology", artSet: "mythology", name: "Olympus Falling", icons: "Mystic", category: "game",
        description: "Rise as a young god in a pantheon where worship is currency and prophecy is a loaded weapon.",
        statNames: { Power: "Divinity", Wealth: "Tribute", People: "Mortals", Knowledge: "Prophecy" },
        colors: { primary: "text-indigo-300", secondary: "text-amber-300", background: "bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950", accent: "border-indigo-300" },
        storyPrompt: "The player is a newly ascended god clawing for a seat in a fading pantheon. Elder gods demand deference, mortal cities offer worship at a price, a titan stirs beneath the mountain, and the Fates keep smiling at inconvenient moments. Choices trade raw divinity, tribute and temples, the devotion of mortals, and glimpses of prophecy that always cost more than they reveal.",
    },
    {
        id: "nautical", artSet: "nautical", name: "Dead Reckoning", icons: "Space", category: "game",
        description: "Captain a merchant vessel through storms, mutiny and a war that keeps redrawing the shipping lanes.",
        statNames: { Power: "Captaincy", Wealth: "Cargo", People: "The Crew", Knowledge: "The Charts" },
        colors: { primary: "text-cyan-400", secondary: "text-slate-300", background: "bg-gradient-to-br from-slate-900 via-cyan-950 to-blue-950", accent: "border-cyan-400" },
        storyPrompt: "The player captains a merchant sailing ship in an age of naval war and thin margins. Convoys, press gangs, storm seasons, an insurance syndicate with sharp lawyers, and a first mate who counts the crew's grievances. Choices trade the captain's authority, cargo and coin, the crew's loyalty, and the accuracy of charts and weather-craft.",
    },
    {
        id: "pirate", artSet: "pirate", name: "Under the Black Flag", icons: "Mystic", category: "game",
        description: "Keep a pirate crew fed, feared and unhanged in a sea running out of easy prizes.",
        statNames: { Power: "Fear", Wealth: "Plunder", People: "The Crew", Knowledge: "Sea-Lore" },
        colors: { primary: "text-red-400", secondary: "text-amber-300", background: "bg-gradient-to-br from-zinc-950 via-red-950 to-slate-950", accent: "border-red-400" },
        storyPrompt: "The player is a pirate captain elected by a crew that can vote them overboard. Navy hunters tighten the net, a governor offers a pardon with strings, a rival captain proposes a fleet, and the map to a legendary wreck is missing its corner. Choices trade the fear of the black flag, plunder shares, the crew's loyalty, and hard-won sea-lore.",
    },
    {
        id: "postapoc", artSet: "postapoc", name: "After the Ash", icons: "Cyber", category: "game",
        description: "Lead a settlement in the ruins, where old-world tech is treasure and every stranger is a verdict.",
        statNames: { Power: "Force", Wealth: "Scrap & Stores", People: "Settlers", Knowledge: "Old-World Tech" },
        colors: { primary: "text-orange-400", secondary: "text-stone-300", background: "bg-gradient-to-br from-stone-950 via-orange-950 to-zinc-950", accent: "border-orange-400" },
        storyPrompt: "The player leads a walled settlement a generation after the collapse. Raider clans circle, a caravan brings medicine and spies, the water table is dropping, and a pre-collapse bunker hums under the ruins. Choices trade armed force, scrap and stores, the settlers' trust, and dangerous old-world technology.",
    },
    {
        id: "prehistoric", artSet: "prehistoric", name: "First Fire", icons: "Mystic", category: "game",
        description: "Guide a tribe through the long winter of the world, when fire is new and the herds decide who eats.",
        statNames: { Power: "Strength", Wealth: "Food Stores", People: "The Tribe", Knowledge: "Fire-Wisdom" },
        colors: { primary: "text-orange-300", secondary: "text-emerald-300", background: "bg-gradient-to-br from-stone-900 via-emerald-950 to-stone-950", accent: "border-orange-300" },
        storyPrompt: "The player leads a tribe at the edge of the ice, where fire is a jealously guarded miracle. The herds change their paths, a rival band shadows the hunting grounds, the shaman reads omens in the smoke, and a stranger arrives carrying a new way to knap stone. Choices trade physical strength, food stores, the tribe's cohesion, and the growing wisdom of fire and toolcraft.",
    },
    {
        id: "samurai", artSet: "samurai", name: "The Way of the Blade", icons: "Mystic", category: "game",
        description: "Serve as a daimyo's right hand in a province where honor and survival keep drawing different maps.",
        statNames: { Power: "Authority", Wealth: "Koku", People: "The Clan", Knowledge: "Bushido" },
        colors: { primary: "text-rose-400", secondary: "text-slate-300", background: "bg-gradient-to-br from-slate-950 via-rose-950 to-zinc-950", accent: "border-rose-400" },
        storyPrompt: "The player is karo — chief retainer — to a young daimyo in a province squeezed between ambitious neighbors. A border insult demands answer, the rice tax is short, ronin gather in the hills, and the shogunate's inspector arrives early. Duels, tea-house diplomacy and winter campaigns. Choices trade clan authority, koku and rice, the clan's cohesion, and the demands of bushido.",
    },
    {
        id: "science", artSet: "science", name: "Critical Mass", icons: "Cyber", category: "game",
        description: "Direct a research institute racing toward a breakthrough that funders, rivals and generals all want first.",
        statNames: { Power: "Influence", Wealth: "Grants", People: "Public Trust", Knowledge: "Discovery" },
        colors: { primary: "text-cyan-300", secondary: "text-violet-300", background: "bg-gradient-to-br from-slate-950 via-indigo-950 to-cyan-950", accent: "border-cyan-300" },
        storyPrompt: "The player directs a research institute closing in on a discovery that could rewrite an industry. A funding cliff approaches, a star researcher wants to publish early, a rival lab is suspiciously well-informed, and a defense contractor keeps calling. Ethics boards, replication crises and midnight results. Choices trade institutional influence, grant money, public trust, and the pace of discovery itself.",
    },
    {
        id: "sport", artSet: "sport", name: "The Season", icons: "Cyber", category: "game",
        description: "Manage a storied club through a make-or-break season of injuries, egos and boardroom knives.",
        statNames: { Power: "Leverage", Wealth: "Payroll", People: "The Fans", Knowledge: "Scouting" },
        colors: { primary: "text-green-400", secondary: "text-yellow-300", background: "bg-gradient-to-br from-zinc-900 via-green-950 to-slate-950", accent: "border-green-400" },
        storyPrompt: "The player manages a storied but fading sports club in a season that will decide their job and the club's future. A star player's contract expires, an academy prodigy isn't ready, the owner wants marketable signings, and the press box has already written the obituary. Choices trade managerial leverage, payroll and transfer funds, the fans' faith, and scouting knowledge.",
    },
    {
        id: "steampunk-chronicles", artSet: "steampunk", name: "Steampunk Chronicles", icons: "Cyber", category: "game",
        description: "Command a clockwork army in a world powered by steam and ingenuity. Will your inventions save the empire or cause its downfall?",
        statNames: { Power: "Empire's Favor", Wealth: "Aetherium Cells", People: "Public Opinion", Knowledge: "Forbidden Blueprints" },
        colors: { primary: "text-amber-500", secondary: "text-cyan-400", background: "bg-gradient-to-br from-stone-800 via-zinc-900 to-stone-900", accent: "border-amber-500" },
        storyPrompt: "The player is the empire's chief artificer in a city of brass, steam and airship docks. The crown demands war engines, the inventors' guild hoards aetherium, saboteurs stalk the foundries, and a forbidden blueprint promises an engine that never stops. Choices trade imperial favor, aetherium and coin, public opinion, and blueprints better left undrawn.",
    },
    {
        id: "underwater", artSet: "underwater", name: "Fathom Station", icons: "Space", category: "game",
        description: "Command a deep-sea station where the pressure outside is nothing next to the pressure within.",
        statNames: { Power: "Command", Wealth: "Air & Supplies", People: "The Crew", Knowledge: "The Deep" },
        colors: { primary: "text-blue-300", secondary: "text-teal-300", background: "bg-gradient-to-br from-blue-950 via-slate-950 to-black", accent: "border-blue-300" },
        storyPrompt: "The player commands a deep-sea research and mining station miles below the surface. Resupply is late, a sonar contact keeps circling the perimeter lights, the corporate office weighs every kilogram of air against profit, and something in the trench is interfering with the instruments. Choices trade command authority, air and supplies, the crew's nerve, and knowledge of the deep.",
    },
    {
        id: "university", artSet: "university", name: "Ivory Tower", icons: "Mystic", category: "game",
        description: "Steer an ancient university through scandal, funding wars and the discovery of a lifetime.",
        statNames: { Power: "Standing", Wealth: "Endowment", People: "Students & Faculty", Knowledge: "Scholarship" },
        colors: { primary: "text-amber-300", secondary: "text-emerald-300", background: "bg-gradient-to-br from-stone-900 via-emerald-950 to-stone-950", accent: "border-amber-300" },
        storyPrompt: "The player is the newly installed chancellor of an ancient university with a proud name and an alarming balance sheet. A donor wants a building renamed, a plagiarism scandal brews in the history department, the students occupy the quad, and a librarian has found something extraordinary in the archives. Choices trade institutional standing, the endowment, the goodwill of students and faculty, and scholarship itself.",
    },
    {
        id: "viking", artSet: "viking", name: "The Long Winter", icons: "Mystic", category: "game",
        description: "Rule as jarl through a winter that will be remembered — the only question is in which saga.",
        statNames: { Power: "Renown", Wealth: "Silver", People: "The Clan", Knowledge: "The Runes" },
        colors: { primary: "text-sky-300", secondary: "text-slate-300", background: "bg-gradient-to-br from-slate-950 via-sky-950 to-zinc-950", accent: "border-sky-300" },
        storyPrompt: "The player is a jarl whose great hall must survive the hardest winter in living memory. The raid season was thin, a blood feud smolders between two families under one roof, a christian missionary overwinters uninvited, and the völva reads unsettling runes. Choices trade renown, silver and stores, the clan's bonds, and knowledge of the old ways.",
    },
    {
        id: "western", artSet: "western", name: "High Noon", icons: "Space", category: "game",
        description: "Wear the star in a frontier town where the railroad, the ranchers and the outlaws all think they own it.",
        statNames: { Power: "The Law", Wealth: "Gold", People: "The Town", Knowledge: "Frontier-Craft" },
        colors: { primary: "text-amber-400", secondary: "text-orange-300", background: "bg-gradient-to-br from-stone-900 via-amber-950 to-stone-950", accent: "border-amber-400" },
        storyPrompt: "The player is the new sheriff of a boomtown at the end of the rail line. The railroad company wants the valley, a cattle baron runs his own justice, an outlaw gang winters in the hills, and the saloon hears everything first. Choices trade the authority of the law, gold and bounties, the town's trust, and frontier-craft.",
    },
    {
        id: "noir", artSet: "noir", name: "Rain City", icons: "Cyber", category: "game",
        description: "A private eye, a case that smells wrong, and a city where every streetlight hides a debt. Classic hard-boiled noir.",
        statNames: { Power: "Nerve", Wealth: "The Retainer", People: "Contacts", Knowledge: "The Case" },
        colors: { primary: "text-slate-300", secondary: "text-amber-300", background: "bg-gradient-to-br from-zinc-950 via-slate-950 to-black", accent: "border-slate-400" },
        storyPrompt: "The player is a down-at-heel private detective in a rain-soaked 1940s city. A femme fatale walks in with a missing-husband case that's really about something else, the police lieutenant owes the player a favor he resents, the newspapers buy secrets, and every witness lies about something. Weave a hard-boiled mystery of double-crosses, stakeouts, corrupt officials and buried truths. Choices trade the detective's nerve, the retainer and expenses, a web of street contacts, and the slowly assembling truth of the case.",
    },
    // ——— Educational (category "education") ———
    // Naming scheme (docs/educational-naming.md): Reality = the world,
    // Deck = the pressure point. Curriculum decks chain via series metadata.
    {
        id: "edu-founders-gambit", artSet: "business", name: "The Ledger", icons: "Cyber", category: "education", educational: "startup and business fundamentals",
        description: "The business world. Deck 1 — Runway: twelve months of cash, one company, no safety net. Every card is a real founder's trade-off.",
        statNames: { Power: "Control", Wealth: "Runway", People: "The Team", Knowledge: "Insight" },
        colors: { primary: "text-emerald-400", secondary: "text-amber-300", background: "bg-gradient-to-br from-slate-900 via-emerald-950 to-zinc-950", accent: "border-emerald-400" },
        storyPrompt: "The player founds a small software startup with twelve months of runway. Take them through the real decisions founders face: pricing the first product, a term sheet that trades board control for cash, a co-founder dispute over equity, hiring a senior manager versus two juniors, a big customer demanding exclusivity, pivoting versus persevering, and when to spend on marketing versus product. Ground every dilemma in genuine business concepts — cash flow versus profit, dilution, product-market fit, opportunity cost, customer concentration risk — so a player finishes understanding WHY each trade-off hurts. Choices trade founder control, cash runway, team trust, and business insight.",
    },
    {
        id: "edu-zero-day", artSet: "cybersecurity", name: "The Perimeter", icons: "Cyber", category: "education", educational: "cybersecurity judgment and trade-offs",
        description: "The security world. Deck 1 — Zero Hour: run security for a company under live attack. Contain or investigate, patch or keep uptime, disclose or dig deeper.",
        statNames: { Power: "Clearance", Wealth: "Budget", People: "Trust", Knowledge: "Threat Intel" },
        colors: { primary: "text-red-400", secondary: "text-cyan-300", background: "bg-gradient-to-br from-zinc-950 via-red-950 to-slate-950", accent: "border-red-400" },
        storyPrompt: "The player is the newly hired security lead at a mid-size company, and the deck spans one escalating incident: from a phishing email through lateral movement to a ransomware detonation and its aftermath. Turn real security judgment into dilemmas: patch now and break production or wait for a maintenance window, pay for a pentest or an EDR tool, disclose a breach early or investigate quietly, force password resets that will flood the helpdesk, restore from backups that might be tainted, negotiate with ransomware operators or refuse. Ground every card in genuine security concepts — least privilege, defense in depth, incident response, social engineering, backup integrity, responsible disclosure — so the player learns why each trade-off matters. Choices trade the security team's authority, budget, organizational trust, and threat intelligence.",
    },
    {
        id: "edu-merge-conflict", artSet: "university", name: "Merge Conflict", icons: "Cyber", category: "education", educational: "software engineering judgment",
        description: "Lead a dev team from prototype to production. Tech debt, testing, rewrites and deadlines — the judgment calls that make or break software.",
        statNames: { Power: "Influence", Wealth: "Deadline", People: "The Team", Knowledge: "Code Quality" },
        colors: { primary: "text-violet-400", secondary: "text-emerald-300", background: "bg-gradient-to-br from-slate-950 via-violet-950 to-zinc-950", accent: "border-violet-400" },
        storyPrompt: "The player becomes tech lead of a small team shipping a product from prototype to production launch. Turn real software engineering judgment into dilemmas: take on tech debt to hit a demo or slip the date, rewrite the legacy module or strangle it gradually, enforce code review when the deadline screams, add tests now or firefight later, adopt the shiny framework or the boring proven one, buy versus build, respond to the 2am outage with a hotfix or a rollback. Ground every card in genuine engineering concepts — technical debt interest, regression risk, bus factor, premature optimization, scope creep, blameless postmortems — so the player learns why each call is hard. Choices trade the lead's influence, deadline slack, the team's health, and the codebase's quality.",
    },
    {
        id: "edu-defenders-dilemma", artSet: "cybersecurity", name: "The Defender's Dilemma", icons: "Cyber", category: "education", educational: "security trade-offs and the assume-breach mindset", deckSize: 20,
        description: "Day one as the sole security lead at a small business. Every choice trades safety, productivity, budget and trust against each other — push any meter too far and you lose. A five-minute 'assume breach' icebreaker: you can't win, only balance.",
        statNames: { Power: "Security", Wealth: "Budget", People: "Trust", Knowledge: "Productivity" },
        colors: { primary: "text-cyan-400", secondary: "text-amber-300", background: "bg-gradient-to-br from-slate-950 via-cyan-950 to-zinc-950", accent: "border-cyan-400" },
        storyPrompt: "The player is the newly-hired, sole security lead at a small Australian business of about 40 staff on a tight budget — and it is their first week, before they have introduced a single control. This is a day-one icebreaker for total beginners: no technical training yet, no jargon, and if a term must appear it explains itself inside the scene. Each card is a short scene with a named character and their role (an office manager, a sales lead, the CEO, a warehouse worker, an IT junior, a journalist, a vendor, an auditor, a customer) making a plain-English request or bringing a dilemma. Cover a variety of pressures — usability versus security, cost versus safety, honesty versus reputation, speed versus caution, staff morale versus control — and include at least one Friday-4:45 time-pressure moment (a looming weekend, a journalist on deadline). CRITICAL: the four meters are NOT 'higher is better' — both extremes are failure, and every choice must be a genuine trade-off where helping one meter clearly hurts at least one other, never a free win and never an obvious correct option. Security too low means you get breached; too high means the business is so locked down nobody can work and shadow IT erupts. Productivity too low means work grinds to a halt; too high means you have stripped out every control to move fast. Budget too low means you cannot fund the basics; too high means you hoarded cash and under-invested in the obvious. Trust too low means staff and customers walk; too high means dangerous complacency where everyone assumes 'we're fine'. Write each consequence so over-investing in one thing visibly costs elsewhere. The lesson the player should FEEL, without any card stating it, is that you cannot maximise everything, so breaches are inevitable and the real skill is balancing trade-offs — this is 'assume breach'. Keep the tone beginner-friendly and a little playful, and use Australian/British spelling (organise, behaviour, defence, prioritise). Choices trade the company's security posture, its budget, the trust of staff and customers, and day-to-day productivity.",
    },
];

/**
 * Standalone decks for decks.json. Curriculum decks: part 2+ of an
 * educational world whose part 1 is embedded in its reality. `deckName`
 * overrides the AI's title so the scheme name sticks.
 */
const DECK_SPECS = [
    {
        id: "perimeter-chain-of-custody", artSet: "cybersecurity", category: "education", educational: "digital forensics judgment",
        deckName: "Chain of Custody",
        series: { name: "The Perimeter", part: 2 },
        statNames: { Power: "Clearance", Wealth: "Budget", People: "Trust", Knowledge: "Threat Intel" },
        storyPrompt: "Sequel to an incident-response story (the ransomware attack is contained; the company survived). The player now leads the forensic investigation: reconstructing the breach, preserving evidence for prosecution and insurance, and briefing lawyers and the board. Turn real digital-forensics judgment into dilemmas: image the compromised server now (downtime) or keep it live and risk contaminating evidence, maintain chain of custody paperwork under deadline pressure, whether logs pulled by a well-meaning admin are still admissible, engaging law enforcement early (losing control) or late (losing goodwill), attributing the attack publicly on thin evidence, paying for expensive cold-storage preservation versus moving on. Ground every card in genuine forensics concepts — evidence integrity, chain of custody, volatile data order, admissibility, attribution confidence — so the player learns why speed and integrity pull against each other.",
    },
    {
        id: "ledger-the-table", artSet: "business", category: "education", educational: "negotiation fundamentals",
        deckName: "The Table",
        series: { name: "The Ledger", part: 2 },
        statNames: { Power: "Control", Wealth: "Runway", People: "The Team", Knowledge: "Insight" },
        storyPrompt: "Sequel to a startup-survival story (the company made it through its first year). The player now spends a year at the negotiating table: a Series A term sheet, an enterprise customer demanding exclusivity and indemnities, a key hire negotiating equity, an acquisition overture, and a vendor contract renewal with a monopoly supplier. Turn real negotiation judgment into dilemmas: anchoring high versus poisoning the relationship, revealing your walk-away point, win-win trades versus pressing leverage, negotiating against a deadline you created, when to walk away from a good-looking deal, BATNA thinking, and reading the other side's constraints. Ground every card in genuine negotiation concepts so the player learns why leverage and trust trade against each other.",
    },
];

/** Multi-part sagas for decks.json (category "game", series metadata). */
const SAGA_SPECS = [
    {
        slug: "hollow-crown", seriesName: "The Hollow Crown", artSet: "kingdom",
        statNames: { Power: "The Crown", Wealth: "The Coffers", People: "The Subjects", Knowledge: "The Council" },
        parts: [
            "Part 1 — The Exile: the player is the rightful heir, smuggled out of the capital the night of the usurpation. Penniless in a border province, they must gather the first loyalists, expose the usurper's lie, and survive the assassins sent after them. End the part with the raising of their banner.",
            "Part 2 — The March: the player's rebel host marches on the capital through a kingdom forced to choose sides. Sieges, defections, a winter crossing, a terrible bargain with a foreign prince. End the part at the gates of the capital.",
            "Part 3 — The Reckoning: the capital falls, but taking a throne is easier than holding one. The usurper's faction must be judged or pardoned, the foreign prince calls in his debt, and the crown the player bled for sits heavier than expected. End the saga with the player's final judgment on the usurper and on themselves.",
        ],
    },
    {
        slug: "ashfall", seriesName: "Ashfall", artSet: "postapoc",
        statNames: { Power: "Force", Wealth: "Scrap & Stores", People: "The Convoy", Knowledge: "Old-World Tech" },
        parts: [
            "Part 1 — The Burning Valley: the player leads a convoy fleeing their home settlement after raiders overrun it. Assemble vehicles and survivors, decide who rides and what burns, and break through the raider cordon. End the part on the open ash roads.",
            "Part 2 — The Dead Highway: the convoy crosses the continent's ruin — toll bridges held by warlords, a ghost city with intact tech and worse, fuel mathematics that decide lives. End the part in sight of the rumored green valley.",
            "Part 3 — The Green Valley: the promised land is already inhabited, and its defenders have every reason to distrust an armed convoy. Negotiate, integrate or conquer — and confront the raiders who followed the convoy's trail. End the saga with the convoy's final fate.",
        ],
    },
];

// ——— Prompt / schema / validation (mirrors generate-decks.mjs) ———

function buildPrompt(spec, { storyPrompt, seriesContext } = {}, attempt = 1) {
    const prompt = storyPrompt ?? spec.storyPrompt;
    const size = spec.deckSize ?? DECK_SIZE; // per-spec override; validator/solver work at any size
    const balanceHint = attempt > 1 ? `
IMPORTANT — a previous attempt at this deck was rejected by an exact solver as UNWINNABLE: on every possible path some stat hit 0 or 100 before the final card. Fix this by keeping effects small (mostly -15 to +15, rarely beyond ±25) and by making sure that for EACH stat, gains and losses alternate along the main path so its running total stays between -20 and +20 from card 0 to the final card.` : "";
    const eduBlock = spec.educational ? `
This is an EDUCATIONAL deck teaching ${spec.educational}. Every card must be a realistic judgment dilemma drawn from the domain — never a recall quiz, never trivia. Both options must be genuinely defensible so the stat effects teach the trade-off. Use correct domain terminology naturally inside the scenario text.` : "";
    return `
A story creator wants a deck of ${size} cards for the game based on this high-level prompt: "${prompt}".
${seriesContext ?? ""}${eduBlock}
Generate a full, unique, and challenging deck of ${size} scenario cards that follows the creator's prompt.
Give the generated deck a cool, thematic name based on the prompt, and write a one-sentence synopsis as the deck's description.
Create a branching narrative using the 'nextCardIndex' property on choices to make the story interactive and replayable. Make sure jumps are valid (within the 0 to ${size - 1} range). The final card in the array (index ${size - 1}) should be the 'win' or final ending card.
CRITICAL — the story must be completable: there must exist at least one sequence of choices that reaches the final card (index ${size - 1}) and finishes the story. Trace a main path from card 0 to card ${size - 1} first, then add loops and detours that branch off and rejoin it. Never create a set of loops the player can't escape toward the ending.
CRITICAL — the story must be survivable: all four stats start at 50 and the player loses if any reaches 0 or 100. Along the main path, for EACH stat, keep the running total of chosen effects roughly between -20 and +20 so a sensible player can finish alive. Mix positive and negative effects per stat; never let one stat only rise or only fall along the main path.${balanceHint}
The choices should have plausible but non-obvious consequences.
Stat changes should generally be between -35 and +35. Balance matters: avoid choices where several stats swing hard in the same direction, and make sure a player who mixes left and right choices can plausibly survive to the final card.
Ensure the prompts are engaging, varied, and fit the theme.
The Power stat is named ${spec.statNames.Power}.
The Wealth stat is named ${spec.statNames.Wealth}.
The People stat is named ${spec.statNames.People}.
The Knowledge stat is named ${spec.statNames.Knowledge}.
Tag each card with an "archetype" that best matches it: petitioner (someone asks you for something), crisis (something bad happens to you), opportunity (a windfall or offer), faction (a power bloc acts), advisor (information or a warning), chain (part of a multi-card storyline), judgement (two parties in dispute and you pick a side), gamble (uncertain outcome), terminal (endings, death, collapse). Most decks are roughly half petitioner cards. The final card should be tagged terminal.

Generate exactly ${size} cards.
`.trim();
}

const effectsSchema = {
    type: "object",
    properties: Object.fromEntries(STAT_NAMES.map(s => [s, { type: "integer" }])),
    required: STAT_NAMES,
    additionalProperties: false,
};
const choiceSchema = {
    type: "object",
    properties: { text: { type: "string" }, effects: effectsSchema, nextCardIndex: { type: "integer" } },
    required: ["text", "effects"],
    additionalProperties: false,
};
const deckSchema = {
    type: "object",
    properties: {
        name: { type: "string" },
        description: { type: "string" },
        cards: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    prompt: { type: "string" },
                    archetype: { type: "string", enum: ARCHETYPES },
                    leftChoice: choiceSchema,
                    rightChoice: choiceSchema,
                },
                required: ["prompt", "leftChoice", "rightChoice"],
                additionalProperties: false,
            },
        },
    },
    required: ["name", "description", "cards"],
    additionalProperties: false,
};

// Port of validateAndRepairDeck (services/aiProvider.ts).
function validateAndRepairDeck(deck) {
    if (!deck || !Array.isArray(deck.cards)) throw new Error("No card deck in response");
    const deckSize = deck.cards.length;
    const sanitizeChoice = (choice) => {
        if (!choice || typeof choice.text !== "string" || choice.text.trim() === "") return null;
        const effects = {};
        for (const stat of STAT_NAMES) {
            const value = Number(choice.effects?.[stat]);
            effects[stat] = Number.isFinite(value) ? Math.max(-MAX_EFFECT, Math.min(MAX_EFFECT, Math.round(value))) : 0;
        }
        const clean = { text: choice.text, effects };
        if (Number.isInteger(choice.nextCardIndex) && choice.nextCardIndex >= 0 && choice.nextCardIndex < deckSize) {
            clean.nextCardIndex = choice.nextCardIndex;
        }
        return clean;
    };
    const cards = [];
    for (const card of deck.cards) {
        if (!card || typeof card.prompt !== "string" || card.prompt.trim() === "") continue;
        const leftChoice = sanitizeChoice(card.leftChoice);
        const rightChoice = sanitizeChoice(card.rightChoice);
        if (!leftChoice || !rightChoice) continue;
        const clean = { prompt: card.prompt, leftChoice, rightChoice };
        if (ARCHETYPES.includes(card.archetype)) clean.archetype = card.archetype;
        cards.push(clean);
    }
    if (cards.length === 0) throw new Error("No playable cards");
    if (cards.length !== deckSize) {
        for (const card of cards) {
            delete card.leftChoice.nextCardIndex;
            delete card.rightChoice.nextCardIndex;
        }
    }
    return { name: deck.name, description: deck.description, cards };
}

/** Bind every card's art to its archetype scene in the spec's store art set. */
function applyArt(deck, artSet) {
    for (const card of deck.cards) {
        const archetype = ARCHETYPES.includes(card.archetype) ? card.archetype : "petitioner";
        card.imageUrl = `${ART_BASE}/${artSet}/${archetype}.webp`;
    }
}

const client = new Anthropic();

async function generateDeck(label, spec, promptOpts, attempt = 1) {
    const MAX_ATTEMPTS = 4;
    console.log(`[${label}] generating${attempt > 1 ? ` — attempt ${attempt}` : ""}...`);
    const systemInstruction = spec.systemInstruction ??
        `You are a creative storyteller for the interactive fiction game "SwipeVerse". You create challenging scenarios themed as "${spec.name ?? spec.seriesName}". The player's goal is to balance four stats: ${STAT_NAMES.map(s => spec.statNames[s]).join(", ")}. If any stat reaches 0 or 100, the player loses.`;
    const stream = client.messages.stream({
        model: "claude-opus-4-8",
        max_tokens: 32000,
        thinking: { type: "adaptive" },
        system: systemInstruction,
        output_config: { format: { type: "json_schema", schema: deckSchema } },
        messages: [{ role: "user", content: buildPrompt(spec, promptOpts, attempt) }],
    });
    const message = await stream.finalMessage();
    if (message.stop_reason === "refusal") throw new Error("Request was refused");
    if (message.stop_reason === "max_tokens") throw new Error("Output truncated (max_tokens)");
    const text = message.content.filter(b => b.type === "text").map(b => b.text).join("");
    const deck = validateAndRepairDeck(JSON.parse(text));

    const playable = checkPlayable(deck);
    if (!playable.ok) {
        console.log(`[${label}] ✗ rejected: ${playable.failures.join(", ")}`);
        if (attempt >= MAX_ATTEMPTS) throw new Error(`[${label}] failed the playability gate ${MAX_ATTEMPTS} times`);
        return generateDeck(label, spec, promptOpts, attempt + 1);
    }
    applyArt(deck, spec.artSet);
    console.log(`[${label}] ✓ "${deck.name}" — ${deck.cards.length} cards`);
    return deck;
}

// ——— Staging + orchestration ———

const stagePath = (id) => join(STAGE_DIR, `${id}.json`);
const isStaged = (id) => existsSync(stagePath(id));
const stage = (id, data) => writeFileSync(stagePath(id), JSON.stringify(data, null, 2) + "\n");
const readStaged = (id) => JSON.parse(readFileSync(stagePath(id), "utf8"));

async function pool(tasks, size) {
    const queue = [...tasks];
    const failures = [];
    const workers = Array.from({ length: size }, async () => {
        while (queue.length > 0) {
            const task = queue.shift();
            try { await task(); } catch (error) { failures.push(error.message); console.error(`  ✗ ${error.message}`); }
        }
    });
    await Promise.all(workers);
    return failures;
}

async function generateRealityTask(spec) {
    if (isStaged(spec.id)) { console.log(`[${spec.id}] already staged — skipping`); return; }
    const deck = await generateDeck(spec.id, spec);
    stage(spec.id, deck);
}

async function generateStandaloneDeckTask(spec) {
    if (isStaged(spec.id)) { console.log(`[${spec.id}] already staged — skipping`); return; }
    const deck = await generateDeck(spec.id, spec);
    if (spec.deckName) deck.name = spec.deckName;
    if (spec.series) deck.series = { ...spec.series };
    stage(spec.id, deck);
}

async function generateSagaTask(saga) {
    let previous = null;
    for (let part = 1; part <= saga.parts.length; part++) {
        const id = `${saga.slug}-${part}`;
        if (isStaged(id)) { console.log(`[${id}] already staged — skipping`); previous = readStaged(id); continue; }
        const seriesContext = previous ? `
This is Part ${part} of the saga "${saga.seriesName}". The previous part was "${previous.name}": ${previous.description} It ended with: "${previous.cards[previous.cards.length - 1].prompt}" Continue the story from there — same protagonist, consequences carried forward.
` : `
This is Part ${part} of a planned ${saga.parts.length}-part saga "${saga.seriesName}". End this part on a resolution that clearly invites the next chapter.
`;
        const deck = await generateDeck(id, saga, { storyPrompt: saga.parts[part - 1], seriesContext });
        deck.series = { name: saga.seriesName, part };
        stage(id, deck);
        previous = deck;
    }
}

function assemble() {
    const realities = [];
    const decks = [];
    const missing = [];
    for (const spec of REALITY_SPECS) {
        if (!isStaged(spec.id)) { missing.push(spec.id); continue; }
        realities.push({
            id: spec.id,
            name: spec.name,
            description: spec.description,
            font: "font-exo",
            systemInstruction: `You are a creative storyteller for the interactive fiction game "SwipeVerse". You create challenging scenarios themed as "${spec.name}". The stats are ${STAT_NAMES.map(s => spec.statNames[s]).join(", ")}.`,
            statNames: spec.statNames,
            statIconNames: ICON_TRIOS[spec.icons],
            imageSet: [],
            colors: spec.colors,
            category: spec.category,
            deck: readStaged(spec.id),
        });
    }
    for (const saga of SAGA_SPECS) {
        for (let part = 1; part <= saga.parts.length; part++) {
            const id = `${saga.slug}-${part}`;
            if (!isStaged(id)) { missing.push(id); continue; }
            decks.push({ ...readStaged(id), category: "game" });
        }
    }
    for (const spec of DECK_SPECS) {
        if (!isStaged(spec.id)) { missing.push(spec.id); continue; }
        decks.push({ ...readStaged(spec.id), category: spec.category });
    }
    if (missing.length > 0) {
        console.error(`\nNot assembling a partial catalog — missing: ${missing.join(", ")}`);
        process.exit(1);
    }
    writeFileSync(join(CATALOG_DIR, "realities.json"), JSON.stringify(realities, null, 2) + "\n");
    writeFileSync(join(CATALOG_DIR, "decks.json"), JSON.stringify(decks, null, 2) + "\n");
    console.log(`\nAssembled catalog: ${realities.length} realities, ${decks.length} saga decks -> ${CATALOG_DIR}`);
    console.log("Validate with: node ../swipeverse-store/scripts/validate.mjs");
}

mkdirSync(STAGE_DIR, { recursive: true });
const args = process.argv.slice(2);
const assembleOnly = args.includes("--assemble-only");
const wanted = args.filter(a => !a.startsWith("--"));

if (!assembleOnly) {
    const realityTargets = REALITY_SPECS.filter(s => wanted.length === 0 || wanted.includes(s.id));
    const deckTargets = DECK_SPECS.filter(s => wanted.length === 0 || wanted.includes(s.id));
    const sagaTargets = SAGA_SPECS.filter(s => wanted.length === 0 || wanted.includes(s.slug));
    const tasks = [
        ...realityTargets.map(spec => () => generateRealityTask(spec)),
        ...deckTargets.map(spec => () => generateStandaloneDeckTask(spec)),
        ...sagaTargets.map(saga => () => generateSagaTask(saga)),
    ];
    const failures = await pool(tasks, CONCURRENCY);
    if (failures.length > 0) {
        console.error(`\n${failures.length} deck(s) failed — rerun to retry (staged decks are skipped).`);
        process.exit(1);
    }
}
assemble();
