// app/student/constants/avatars.ts
// ─────────────────────────────────────────────────────
// All avatars use emoji + CSS gradients only.
// Zero network requests. Works fully offline.
// Designed for teenage girls — fun, relatable, not random.
// Categories: Animals, Space, Sports, Food, Nature, Fun
// ─────────────────────────────────────────────────────

export interface Avatar {
  id: string;
  emoji: string;
  label: string;
  bg: string;
  category: string;
}

export const AVATARS: Avatar[] = [
  // 🐾 Animals — universally loved
  { id:"cat",      emoji:"🐱", label:"Cat",        bg:"linear-gradient(135deg,#fef3c7,#fde68a)",  category:"Animals"  },
  { id:"panda",    emoji:"🐼", label:"Panda",       bg:"linear-gradient(135deg,#f0fdf4,#bbf7d0)",  category:"Animals"  },
  { id:"bunny",    emoji:"🐰", label:"Bunny",       bg:"linear-gradient(135deg,#fce7f3,#fbcfe8)",  category:"Animals"  },
  { id:"fox",      emoji:"🦊", label:"Fox",         bg:"linear-gradient(135deg,#fff7ed,#fed7aa)",  category:"Animals"  },
  { id:"dolphin",  emoji:"🐬", label:"Dolphin",     bg:"linear-gradient(135deg,#dbeafe,#bfdbfe)",  category:"Animals"  },
  { id:"owl",      emoji:"🦉", label:"Owl",         bg:"linear-gradient(135deg,#fef3c7,#d1fae5)",  category:"Animals"  },

  // 🚀 Space — aspirational
  { id:"rocket",   emoji:"🚀", label:"Rocket",      bg:"linear-gradient(135deg,#1e1b4b,#3730a3)",  category:"Space"    },
  { id:"star",     emoji:"⭐", label:"Star",        bg:"linear-gradient(135deg,#fef9c3,#fde68a)",  category:"Space"    },
  { id:"planet",   emoji:"🪐", label:"Planet",      bg:"linear-gradient(135deg,#ede9fe,#c4b5fd)",  category:"Space"    },
  { id:"moon",     emoji:"🌙", label:"Moon",        bg:"linear-gradient(135deg,#e0e7ff,#c7d2fe)",  category:"Space"    },
  { id:"comet",    emoji:"☄️", label:"Comet",       bg:"linear-gradient(135deg,#1e1b4b,#7c3aed)",  category:"Space"    },
  { id:"aurora",   emoji:"🌌", label:"Galaxy",      bg:"linear-gradient(135deg,#0f172a,#4c1d95)",  category:"Space"    },

  // ⚽ Sports — active & energetic
  { id:"football", emoji:"⚽", label:"Football",    bg:"linear-gradient(135deg,#d1fae5,#6ee7b7)",  category:"Sports"   },
  { id:"cricket",  emoji:"🏏", label:"Cricket",     bg:"linear-gradient(135deg,#fef3c7,#fde68a)",  category:"Sports"   },
  { id:"athlete",  emoji:"🏃‍♀️", label:"Runner",    bg:"linear-gradient(135deg,#dbeafe,#93c5fd)",  category:"Sports"   },
  { id:"champion", emoji:"🏆", label:"Champion",    bg:"linear-gradient(135deg,#fef9c3,#fbbf24)",  category:"Sports"   },

  // 🎨 Creative — artistic kids
  { id:"artist",   emoji:"🎨", label:"Artist",      bg:"linear-gradient(135deg,#fce7f3,#ddd6fe)",  category:"Creative" },
  { id:"music",    emoji:"🎵", label:"Music",       bg:"linear-gradient(135deg,#ede9fe,#ddd6fe)",  category:"Creative" },
  { id:"book",     emoji:"📚", label:"Bookworm",    bg:"linear-gradient(135deg,#dbeafe,#ede9fe)",  category:"Creative" },
  { id:"science",  emoji:"🔬", label:"Scientist",   bg:"linear-gradient(135deg,#d1fae5,#dbeafe)",  category:"Creative" },

  // 🌿 Nature — Kashmir connection
  { id:"mountain", emoji:"🏔️", label:"Mountain",   bg:"linear-gradient(135deg,#dbeafe,#c7d2fe)",  category:"Nature"   },
  { id:"flower",   emoji:"🌺", label:"Flower",      bg:"linear-gradient(135deg,#fce7f3,#fbcfe8)",  category:"Nature"   },
  { id:"butterfly",emoji:"🦋", label:"Butterfly",   bg:"linear-gradient(135deg,#d1fae5,#bbf7d0)",  category:"Nature"   },
  { id:"rainbow",  emoji:"🌈", label:"Rainbow",     bg:"linear-gradient(135deg,#fce7f3,#dbeafe)",  category:"Nature"   },
];

export const AVATAR_CATEGORIES = ["Animals", "Space", "Sports", "Creative", "Nature"] as const;

export function getAvatar(id: string): Avatar {
  return AVATARS.find(a => a.id === id) ?? AVATARS[0];
}