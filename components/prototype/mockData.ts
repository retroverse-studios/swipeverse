/**
 * PROTOTYPE — design-refresh direction mockups (throwaway).
 * Shared mock content so every variant renders the same real data.
 */

export const MOCK_REALITIES = [
  {
    id: 'cyberpunk',
    name: 'Cyberpunk Dystopia',
    tagline: 'Neon streets, corporate leashes, banned tech.',
    accent: '#ff52e1',
    art: '/cards/cyberpunk/crisis.webp',
    back: '/cards/backs/cyberpunk.webp',
  },
  {
    id: 'mystical',
    name: 'Mystical Kingdom',
    tagline: 'The old magic is waking. The wards are failing.',
    accent: '#ffc857',
    art: '/cards/mystical/opportunity.webp',
    back: '/cards/backs/mystical.webp',
  },
  {
    id: 'space',
    name: 'Galactic Imperium',
    tagline: 'A precursor relic stirs at the rim of known space.',
    accent: '#22d3ee',
    art: '/cards/space/chain.webp',
    back: '/cards/backs/space.webp',
  },
];

// Real card 0 of the bundled "Wetware Ascendant" deck
export const MOCK_CARD = {
  prompt:
    "A dead courier's satchel spills open in your hands: a prototype neural implant still warm with encrypted firmware.",
  left: 'Pocket it and vanish into the undercity',
  right: 'Call your Zenith Corp handler immediately',
  archetype: 'petitioner',
  art: '/cards/cyberpunk/petitioner.webp',
  back: '/cards/backs/cyberpunk.webp',
  badge: '/cards/badges/cyberpunk/knowledge.webp',
};

export const MOCK_STATS: { key: string; label: string; value: number; badge: string }[] = [
  { key: 'Power', label: 'Corp. Power', value: 62, badge: '/cards/badges/cyberpunk/power.webp' },
  { key: 'Wealth', label: 'Street Cred', value: 38, badge: '/cards/badges/cyberpunk/wealth.webp' },
  { key: 'People', label: 'Citizen Trust', value: 85, badge: '/cards/badges/cyberpunk/people.webp' },
  { key: 'Knowledge', label: 'Banned Tech', value: 14, badge: '/cards/badges/cyberpunk/knowledge.webp' },
];

// 85 and 14 are deliberately in the danger zone (≥85 / ≤15) so each
// direction has to show its warning treatment.
export const isDanger = (value: number) => value <= 15 || value >= 85;

export type PrototypeScreen = 'menu' | 'game';
export type VariantProps = { screen: PrototypeScreen };

export const NODE_LABEL = 'Node 7 / 20';
