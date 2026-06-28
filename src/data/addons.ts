export interface CuratedAddon {
  id: string;
  name: string;
  description: string;
  category: 'combat' | 'ui' | 'chat' | 'ah' | 'questing' | 'social' | 'wakingdream';
  size_kb: number;
  source_url?: string;
  zip_url: string;
  installs_to: string;
  recommended: boolean;
}

export const CURATED_ADDONS: CuratedAddon[] = [
  {
    id: 'dbm',
    name: 'Deadly Boss Mods (DBM)',
    description: 'Boss-timer & mechanic warnings — essential for raiding.',
    category: 'combat',
    size_kb: 8200,
    zip_url: 'https://patches.wakingdream.cc/addons/dbm-3.3.5.zip',
    installs_to: 'DBM-Core',
    recommended: true,
  },
  {
    id: 'recount',
    name: 'Recount',
    description: 'Classic DPS / HPS meter, lightweight and accurate.',
    category: 'combat',
    size_kb: 2200,
    zip_url: 'https://patches.wakingdream.cc/addons/recount-3.3.5.zip',
    installs_to: 'Recount',
    recommended: true,
  },
  {
    id: 'atlasloot',
    name: 'Atlas + AtlasLoot',
    description: 'Dungeon maps and complete loot tables for all instances.',
    category: 'questing',
    size_kb: 25000,
    zip_url: 'https://patches.wakingdream.cc/addons/atlasloot-3.3.5.zip',
    installs_to: 'AtlasLoot',
    recommended: true,
  },
  {
    id: 'bartender4',
    name: 'Bartender4',
    description: 'Fully customizable action-bar replacement.',
    category: 'ui',
    size_kb: 1100,
    zip_url: 'https://patches.wakingdream.cc/addons/bartender4-3.3.5.zip',
    installs_to: 'Bartender4',
    recommended: true,
  },
  {
    id: 'auctionator',
    name: 'Auctionator',
    description: 'Auction House buy/sell helper with price history.',
    category: 'ah',
    size_kb: 1300,
    zip_url: 'https://patches.wakingdream.cc/addons/auctionator-3.3.5.zip',
    installs_to: 'Auctionator',
    recommended: true,
  },
  {
    id: 'postal',
    name: 'Postal',
    description: 'Mailbox bulk-handling: open all, return all, etc.',
    category: 'ui',
    size_kb: 500,
    zip_url: 'https://patches.wakingdream.cc/addons/postal-3.3.5.zip',
    installs_to: 'Postal',
    recommended: true,
  },
  {
    id: 'pawn',
    name: 'Pawn',
    description: 'Item-comparison and gear-scoring with custom weight sets.',
    category: 'combat',
    size_kb: 1100,
    zip_url: 'https://patches.wakingdream.cc/addons/pawn-3.3.5.zip',
    installs_to: 'Pawn',
    recommended: false,
  },
  {
    id: 'titanpanel',
    name: 'TitanPanel',
    description: 'Top/bottom info-bars: bag space, gold, XP, ping, durability, …',
    category: 'ui',
    size_kb: 2000,
    zip_url: 'https://patches.wakingdream.cc/addons/titanpanel-3.3.5.zip',
    installs_to: 'Titan',
    recommended: false,
  },
  {
    id: 'wim',
    name: 'WIM (Whisper Instant Messenger)',
    description: 'Whisper popups in resizable windows — closer to a chat app.',
    category: 'chat',
    size_kb: 1100,
    zip_url: 'https://patches.wakingdream.cc/addons/wim-3.3.5.zip',
    installs_to: 'WIM',
    recommended: false,
  },
  {
    id: 'tacotip',
    name: 'TacoTip',
    description: 'Extended tooltips: gear-score, mount, talent spec.',
    category: 'ui',
    size_kb: 700,
    zip_url: 'https://patches.wakingdream.cc/addons/tacotip-3.3.5.zip',
    installs_to: 'TacoTip',
    recommended: false,
  },
  {
    id: 'wakingdream-companion',
    name: 'Wakingdream Companion ⭐',
    description:
      'Our own addon: World boss spawn timer, Hyjal quest hints, Activity Token balance, custom notifications.',
    category: 'wakingdream',
    size_kb: 800,
    zip_url: 'https://patches.wakingdream.cc/addons/wakingdream-companion.zip',
    installs_to: 'Wakingdream',
    recommended: true,
  },
];
