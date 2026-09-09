import type { Passage, MobTableEntry } from '../types/narrative';

export const CUSTOM_STORY_STORAGE_KEY = 'minecraft_custom_story_passages';

export const STORY_PASSAGES: Record<string, Passage> = {
  "start": {
    "id": "start",
    "title": "Awakening at Sunrise",
    "text": "You awake atop a grassy hill overlooking a vast voxel frontier. Morning light bathes the blocky wilderness. In your hand is your trusty Wooden Pickaxe. To the east, the sun casts long shadows over an ominous tree line. To the north, a dark cave mouth opens into the hillside. Down the slope sits a weathered woodcutter shack.",
    "icon": "",
    "accessibleViews": [
      "forest"
    ],
    "choices": [
      {
        "text": "Investigate the abandoned woodcutter's shack down the slope",
        "targetPassageId": "abandoned_shack"
      },
      {
        "text": "Enter the Deep Woods",
        "targetPassageId": "deep_woods_entrance"
      },
      {
        "text": "Approach the dark cave mouth in the hillside",
        "targetPassageId": "cavern_mouth"
      }
    ]
  },
  "abandoned_shack": {
    "id": "abandoned_shack",
    "title": "Abandoned Woodcutter's Shack",
    "text": "The wooden door hangs crooked on rusty hinges. Dust motes dance in rays of sunlight. Inside sits an intact Crafting Bench, and buried beneath a floorboard is a traveler's chest containing dry timber and a lit Torch!",
    "icon": "",
    "autoGrant": {
      "equipment": [
        "Torch"
      ],
      "materials": {
        "Wood": 2
      },
      "message": "Salvaged a Torch and 2 Wood from the hidden chest!"
    },
    "accessibleViews": [
      "crafting"
    ],
    "choices": [
      {
        "text": "Use the Crafting Bench to forge equipment",
        "type": "view",
        "targetView": "crafting"
      },
      {
        "text": "Follow a worn path behind the cabin into the woods",
        "targetPassageId": "deep_woods_entrance"
      },
      {
        "text": "Head back up to the grassy hill",
        "targetPassageId": "start"
      }
    ]
  },
  "deep_woods_entrance": {
    "id": "deep_woods_entrance",
    "title": "The Whispering Woods",
    "text": "Towering oak and dark birch trees block out the daylight. The air is cool and dense. Vines hang low, and cobwebs stretch between ancient branches. A distant river rushes toward open water.",
    "icon": "",
    "accessibleViews": [
      "forest"
    ],
    "choices": [
      {
        "text": "Forage and explore groves in the woods",
        "type": "view",
        "targetView": "forest"
      },
      {
        "text": "Chop through dense brambles into a spider clearing (Requires 2 Groves Cleared)",
        "requiresGrovesCleared": 2,
        "targetPassageId": "spider_nest"
      },
      {
        "text": "Sail along the woodland river to the coast (Requires a Boat)",
        "requiresItem": "Boat",
        "targetPassageId": "ocean_monument_shore"
      },
      {
        "text": "Investigate violet smoke rising above the swamp trees",
        "targetPassageId": "witch_hut"
      },
      {
        "text": "Return to the sunny hill",
        "targetPassageId": "start"
      }
    ]
  },
  "spider_nest": {
    "id": "spider_nest",
    "title": "Web-Choked Clearing",
    "text": "Thick silk strands bind the trees like walls. Skeletons of long-lost explorers hang suspended above. From the boughs above, glowing multi-faceted eyes fixate on you!",
    "icon": "",
    "choices": [
      {
        "text": "Draw your weapon and attack the lurking spider!",
        "type": "combat",
        "mobTable": [
          {
            "mob": "Spider",
            "rollRange": [
              1,
              3
            ],
            "label": "1-3: Giant Forest Spider"
          },
          {
            "mob": "Cave Spider",
            "rollRange": [
              4,
              6
            ],
            "label": "4-6: Venomous Cave Spider"
          }
        ],
        "onVictoryPassageId": "spider_nest_cleared",
        "onDefeatPassageId": "spider_nest_defeat"
      },
      {
        "text": "Attempt to slip through the webs quietly (Agility Check 4+)",
        "type": "dice_check",
        "diceCheck": {
          "target": 4,
          "successPassageId": "deep_woods_entrance",
          "failurePassageId": "spider_nest_ambush",
          "successText": "You cut through the silk silently and escaped!",
          "failureText": "Your boots snapped a silk anchor line! The spiders drop down!"
        }
      }
    ]
  },
  "spider_nest_ambush": {
    "id": "spider_nest_ambush",
    "title": "Entangled in Webbing!",
    "text": "You are ensnared in sticky webs! A venomous Cave Spider lunges straight from the canopy!",
    "icon": "",
    "triggerCombat": {
      "mob": "Cave Spider",
      "introText": "The Cave Spider strikes while you are pinned!",
      "onVictoryPassageId": "spider_nest_cleared",
      "onDefeatPassageId": "spider_nest_defeat"
    },
    "choices": [
      {
        "text": "Fight for survival!",
        "type": "combat",
        "mob": "Cave Spider",
        "onVictoryPassageId": "spider_nest_cleared",
        "onDefeatPassageId": "spider_nest_defeat"
      }
    ]
  },
  "spider_nest_cleared": {
    "id": "spider_nest_cleared",
    "title": "Silk-Wrapped Hoard",
    "text": "The fallen spider disintegrates into sticky threads. Behind its lair, you uncover discarded packs containing fresh leather hides and strong silk string.",
    "icon": "",
    "autoGrant": {
      "materials": {
        "String": 3,
        "Leather": 2
      },
      "message": "Gathered 3 String and 2 Leather from the nest!"
    },
    "accessibleViews": [
      "forest"
    ],
    "choices": [
      {
        "text": "Trek toward the swamp smoke",
        "targetPassageId": "witch_hut"
      },
      {
        "text": "Return to the forest entrance",
        "targetPassageId": "deep_woods_entrance"
      }
    ]
  },
  "witch_hut": {
    "id": "witch_hut",
    "title": "The Swamp Witch's Stilt Hut",
    "text": "A rickety spruce hut stands perched on wooden stilts above murky water. Inside, a Witch cackles as purple steam roils out of an iron cauldron.",
    "icon": "",
    "choices": [
      {
        "text": "Ambush the Witch while she brews!",
        "type": "combat",
        "mob": "Witch",
        "onVictoryPassageId": "witch_spoils",
        "onDefeatPassageId": "witch_defeat"
      },
      {
        "text": "Carefully sneak inside to snatch ingredients (Stealth Check 4+)",
        "type": "dice_check",
        "diceCheck": {
          "target": 4,
          "successPassageId": "witch_spoils",
          "failurePassageId": "witch_trap",
          "successText": "You stealthily looted the potion shelves!",
          "failureText": "A potion vial tipped over and smashed! The Witch whips around!"
        }
      },
      {
        "text": "Quietly slip back into the woods",
        "targetPassageId": "deep_woods_entrance"
      }
    ]
  },
  "witch_trap": {
    "id": "witch_trap",
    "title": "Corrosive Mist!",
    "text": "The Witch hurls a Splash Potion of Harming directly at your boots! Corrosive vapors burn your skin (-3 HP) as she brandishes another brew!",
    "icon": "",
    "autoGrant": {
      "healthDelta": -3,
      "message": "Suffered 3 damage from the corrosive splash potion!"
    },
    "triggerCombat": {
      "mob": "Witch",
      "introText": "The enraged Witch charges into battle!",
      "onVictoryPassageId": "witch_spoils",
      "onDefeatPassageId": "witch_defeat"
    },
    "choices": [
      {
        "text": "Battle the Witch!",
        "type": "combat",
        "mob": "Witch",
        "onVictoryPassageId": "witch_spoils",
        "onDefeatPassageId": "witch_defeat"
      }
    ]
  },
  "witch_spoils": {
    "id": "witch_spoils",
    "title": "The Alchemist's Stash",
    "text": "The Witch vanishes with a shriek. The bubbling cauldron calms, leaving behind precious alchemy supplies and an invigorating medicinal elixir.",
    "icon": "",
    "autoGrant": {
      "materials": {
        "Gunpowder": 3,
        "Slimeball": 2
      },
      "healthDelta": 4,
      "message": "Restored 4 Hearts and looted 3 Gunpowder & 2 Slimeballs!"
    },
    "choices": [
      {
        "text": "Head back to the Deep Woods",
        "targetPassageId": "deep_woods_entrance"
      },
      {
        "text": "Return to the hilltop shelter",
        "targetPassageId": "start"
      }
    ]
  },
  "cavern_mouth": {
    "id": "cavern_mouth",
    "title": "The Mouth of the Abyss",
    "text": "A cavern opening plunges into subterranean gloom. Cold, damp air rises from the dark with the faint clatter of bones and rumbling stone.",
    "icon": "",
    "choices": [
      {
        "text": "Hold your Torch high and venture deep underground (Requires Torch)",
        "requiresItem": "Torch",
        "targetPassageId": "lit_cavern"
      },
      {
        "text": "Feel your way down blindly without a light (Perception Check 4+)",
        "type": "dice_check",
        "diceCheck": {
          "target": 4,
          "successPassageId": "lit_cavern",
          "failurePassageId": "cavern_ambush",
          "successText": "You navigated the treacherous ledges safely!",
          "failureText": "You slipped on wet gravel and slid into a monster nest!"
        }
      },
      {
        "text": "Retreat to the safety of the hillside",
        "targetPassageId": "start"
      }
    ]
  },
  "cavern_ambush": {
    "id": "cavern_ambush",
    "title": "Ambush in the Dark!",
    "text": "You crash onto a lower stone ledge. In the pitch black, hostile shapes emerge from the gloom!",
    "icon": "",
    "triggerCombat": {
      "mobTable": [
        {
          "mob": "Zombie",
          "rollRange": [
            1,
            2
          ],
          "label": "1-2: Cavern Zombie"
        },
        {
          "mob": "Skeleton",
          "rollRange": [
            3,
            4
          ],
          "label": "3-4: Skeleton Archer"
        },
        {
          "mob": "Creeper",
          "rollRange": [
            5,
            6
          ],
          "label": "5-6: Hissing Creeper"
        }
      ],
      "introText": "A hostile subterranean monster attacks!",
      "onVictoryPassageId": "lit_cavern",
      "onDefeatPassageId": "cavern_defeat"
    },
    "choices": [
      {
        "text": "Fight the cavern beast!",
        "type": "combat",
        "mobTable": [
          {
            "mob": "Zombie",
            "rollRange": [
              1,
              2
            ],
            "label": "1-2: Cavern Zombie"
          },
          {
            "mob": "Skeleton",
            "rollRange": [
              3,
              4
            ],
            "label": "3-4: Skeleton Archer"
          },
          {
            "mob": "Creeper",
            "rollRange": [
              5,
              6
            ],
            "label": "5-6: Hissing Creeper"
          }
        ],
        "onVictoryPassageId": "lit_cavern",
        "onDefeatPassageId": "cavern_defeat"
      }
    ]
  },
  "lit_cavern": {
    "id": "lit_cavern",
    "title": "The Subterranean Quarry",
    "text": "Torchlight reveals a vast mining chamber. Veins of coal, iron, and stone cross the walls. Old mining tracks stretch into the deep.",
    "icon": "",
    "accessibleViews": [
      "mining"
    ],
    "choices": [
      {
        "text": "Excavate the mineral veins on a Mining Expedition",
        "type": "view",
        "targetView": "mining"
      },
      {
        "text": "Descend deeper toward the roar of molten lava",
        "targetPassageId": "lava_chamber"
      },
      {
        "text": "Climb back up to the surface",
        "targetPassageId": "cavern_mouth"
      }
    ]
  },
  "lava_chamber": {
    "id": "lava_chamber",
    "title": "The Magma Chasm",
    "text": "Intense heat radiates from a vast underground lake of boiling lava. Across the lake stands a fortified dungeon gate carved into obsidian bedrock. A broken stone path crosses the molten lake.",
    "icon": "",
    "choices": [
      {
        "text": "Pour water from a Bucket to create a solid obsidian bridge (Requires Bucket)",
        "requiresItem": "Bucket",
        "targetPassageId": "dungeon_gate"
      },
      {
        "text": "Build a makeshift wooden walkway (Costs 3 Wood)",
        "requiresMaterial": {
          "material": "Wood",
          "count": 3
        },
        "consumeMaterial": {
          "material": "Wood",
          "count": 3
        },
        "targetPassageId": "dungeon_gate"
      },
      {
        "text": "Sprint and leap across crumbling magma blocks (Agility Check 5+)",
        "type": "dice_check",
        "diceCheck": {
          "target": 5,
          "successPassageId": "dungeon_gate",
          "failurePassageId": "lava_burn",
          "successText": "You leaped cleanly across the molten chasm!",
          "failureText": "A magma ledge collapsed, splashing you with boiling lava!"
        }
      },
      {
        "text": "Retreat back to the mining quarry",
        "targetPassageId": "lit_cavern"
      }
    ]
  },
  "lava_burn": {
    "id": "lava_burn",
    "title": "Scorched by Lava!",
    "text": "You scramble backward onto stone with smoldering boots (-5 HP)! The lava lake bubbles menacingly.",
    "icon": "",
    "autoGrant": {
      "healthDelta": -5,
      "message": "Took 5 fire damage from touching molten lava!"
    },
    "choices": [
      {
        "text": "Catch your breath and reconsider",
        "targetPassageId": "lava_chamber"
      },
      {
        "text": "Retreat to the upper quarry to recover",
        "targetPassageId": "lit_cavern"
      }
    ]
  },
  "dungeon_gate": {
    "id": "dungeon_gate",
    "title": "The Fortified Dungeon Gate",
    "text": "You reach the reinforced obsidian gate. Heavy iron bars block access to the treasure vault. A hulking Vindicator wielding an enchanted iron axe guards the door!",
    "icon": "",
    "choices": [
      {
        "text": "Challenge the Vindicator guard in combat!",
        "type": "combat",
        "mob": "Vindicator",
        "onVictoryPassageId": "vault_room",
        "onDefeatPassageId": "dungeon_gate_defeat"
      },
      {
        "text": "Blast the fortified gate apart with TNT (Requires TNT)",
        "requiresItem": "TNT",
        "targetPassageId": "vault_room"
      },
      {
        "text": "Mine through the obsidian walls with a Diamond Pickaxe (Requires Diamond Pickaxe)",
        "requiresItem": "Diamond Pickaxe",
        "targetPassageId": "vault_room"
      },
      {
        "text": "Back away to the lava lake ledge",
        "targetPassageId": "lava_chamber"
      }
    ]
  },
  "vault_room": {
    "id": "vault_room",
    "title": "The Vault of Wonders",
    "text": "The heavy barrier crumbles! Inside lies an altar glowing with warm golden light. On top sits a radiant Totem of Undying, accompanied by raw diamonds and forged iron ingots!",
    "icon": "",
    "autoGrant": {
      "equipment": [
        "Totem of Undying"
      ],
      "materials": {
        "Diamond": 3,
        "Iron": 3
      },
      "message": "Claimed a Totem of Undying, 3 Diamonds, and 3 Iron ingots!"
    },
    "accessibleViews": [
      "crafting"
    ],
    "choices": [
      {
        "text": "Use the vault anvil to craft masterwork equipment",
        "type": "view",
        "targetView": "crafting"
      },
      {
        "text": "Complete your journey in glorious triumph!",
        "targetPassageId": "victory_epilogue"
      }
    ]
  },
  "ocean_monument_shore": {
    "id": "ocean_monument_shore",
    "title": "The Prismarine Coast",
    "text": "Riding your wooden boat onto the sea, you gaze into clear depths. Beneath the waves lies an underwater temple glowing with prismarine lanterns. Spiky Guardians patrol the entrance.",
    "icon": "",
    "choices": [
      {
        "text": "Dive into the ocean to engage the Guardian sentry!",
        "type": "combat",
        "mob": "Guardian",
        "onVictoryPassageId": "elder_sanctum",
        "onDefeatPassageId": "ocean_defeat"
      },
      {
        "text": "Explore the sunken shipwreck reef (Requires Iron Sword)",
        "requiresItem": "Iron Sword",
        "targetPassageId": "drowned_shore"
      },
      {
        "text": "Row your boat back to the forest shore",
        "targetPassageId": "deep_woods_entrance"
      }
    ]
  },
  "drowned_shore": {
    "id": "drowned_shore",
    "title": "The Shipwreck Cove",
    "text": "A rotten galleon rests on the reef. From the seaweed rises an armored Drowned holding a gleaming trident!",
    "icon": "",
    "triggerCombat": {
      "mob": "Drowned",
      "introText": "The Drowned emerges from the surf!",
      "onVictoryPassageId": "drowned_spoils",
      "onDefeatPassageId": "ocean_defeat"
    },
    "choices": [
      {
        "text": "Battle the Drowned!",
        "type": "combat",
        "mob": "Drowned",
        "onVictoryPassageId": "drowned_spoils",
        "onDefeatPassageId": "ocean_defeat"
      },
      {
        "text": "Swim back to your boat",
        "targetPassageId": "ocean_monument_shore"
      }
    ]
  },
  "drowned_spoils": {
    "id": "drowned_spoils",
    "title": "Sunken Ship's Bounty",
    "text": "The Drowned collapses into bubbles. Inside the half-submerged cargo hold, you discover salvage: forged iron, fresh fish, and cured leather.",
    "icon": "",
    "autoGrant": {
      "materials": {
        "Iron": 2,
        "Fish": 3,
        "Leather": 2
      },
      "message": "Retrieved 2 Iron, 3 Fish, and 2 Leather from the wreck!"
    },
    "choices": [
      {
        "text": "Return to the Ocean Monument",
        "targetPassageId": "ocean_monument_shore"
      },
      {
        "text": "Sail back to the forest",
        "targetPassageId": "deep_woods_entrance"
      }
    ]
  },
  "elder_sanctum": {
    "id": "elder_sanctum",
    "title": "The Elder Guardian's Throne",
    "text": "You swim into the prismarine inner sanctum. The colossal Elder Guardian hovers in the center, charging its laser beam and locking its unblinking eye upon you!",
    "icon": "",
    "triggerCombat": {
      "mob": "Elder Guardian",
      "introText": "The ancient titan unleashes its beam!",
      "onVictoryPassageId": "victory_epilogue",
      "onDefeatPassageId": "ocean_defeat"
    },
    "choices": [
      {
        "text": "Confront and defeat the Elder Guardian!",
        "type": "combat",
        "mob": "Elder Guardian",
        "onVictoryPassageId": "victory_epilogue",
        "onDefeatPassageId": "ocean_defeat"
      },
      {
        "text": "Swim back to the surface boat",
        "targetPassageId": "ocean_monument_shore"
      }
    ]
  },
  "victory_epilogue": {
    "id": "victory_epilogue",
    "title": "Champion of the Overworld",
    "text": "Victory! You have explored dark depths, vanquished mythical beasts, navigated chasms, and forged masterwork equipment. Your name is etched into the bedrock as a true adventurer!",
    "icon": "",
    "autoGrant": {
      "healthDelta": 20,
      "message": "Hearts restored to maximum in celebration of victory!"
    },
    "choices": [
      {
        "text": "Return to the hilltop and continue exploring the realm",
        "targetPassageId": "start"
      }
    ]
  },
  "spider_nest_defeat": {
    "id": "spider_nest_defeat",
    "title": "Cocooned and Dragged Away",
    "text": "Paralyzing venom saps your strength as darkness closes in. You awaken hours later tangled in loose webbing near the forest perimeter.",
    "icon": "",
    "accessibleViews": [
      "forest"
    ],
    "choices": [
      {
        "text": "Limp back to the forest entrance",
        "targetPassageId": "deep_woods_entrance"
      },
      {
        "text": "Stumble back to the hillside shelter",
        "targetPassageId": "start"
      }
    ]
  },
  "witch_defeat": {
    "id": "witch_defeat",
    "title": "Cursed in the Swamps",
    "text": "Noxious potion fumes overcome you. The Witch cackles as she tosses you into the murky swamp water. You drag yourself ashore, soaking and bruised.",
    "icon": "",
    "accessibleViews": [
      "forest"
    ],
    "choices": [
      {
        "text": "Retreat back to the deep woods",
        "targetPassageId": "deep_woods_entrance"
      }
    ]
  },
  "cavern_defeat": {
    "id": "cavern_defeat",
    "title": "Cast Out of the Cavern",
    "text": "Overpowered in the dark, you tumble backward down a gravel chute and roll out into the daylight at the cavern mouth, bruised and battered.",
    "icon": "",
    "choices": [
      {
        "text": "Catch your breath at the cavern mouth",
        "targetPassageId": "cavern_mouth"
      },
      {
        "text": "Return to the hilltop shelter",
        "targetPassageId": "start"
      }
    ]
  },
  "dungeon_gate_defeat": {
    "id": "dungeon_gate_defeat",
    "title": "Repelled at the Gate",
    "text": "The Vindicator's crushing strike knocks you backward across the obsidian stones. You scramble back to safety before the iron gate slams shut.",
    "icon": "",
    "choices": [
      {
        "text": "Regroup at the lava chasm",
        "targetPassageId": "lava_chamber"
      }
    ]
  },
  "ocean_defeat": {
    "id": "ocean_defeat",
    "title": "Washed Ashore",
    "text": "The crushing ocean depths and searing guardian beams overpower you. You lose consciousness and wash up coughing saltwater onto the coast.",
    "icon": "",
    "choices": [
      {
        "text": "Recover on the shore",
        "targetPassageId": "ocean_monument_shore"
      },
      {
        "text": "Return to the forest",
        "targetPassageId": "deep_woods_entrance"
      }
    ]
  },
  "combat_defeat": {
    "id": "combat_defeat",
    "title": "Defeated in Battle",
    "text": "Your vision fades as you collapse. You awaken some time later, having barely survived the encounter.",
    "icon": "",
    "choices": [
      {
        "text": "Return to sunrise hill",
        "targetPassageId": "start"
      }
    ]
  }
};

export function getPassage(id: string): Passage {
  return STORY_PASSAGES[id] || STORY_PASSAGES.start;
}

export function rollOnMobTable(table: MobTableEntry[]): { mob: string; roll: number } {
  const roll = Math.floor(Math.random() * 6) + 1;
  const match = table.find((entry) => roll >= entry.rollRange[0] && roll <= entry.rollRange[1]);
  return {
    mob: match ? match.mob : table[0].mob,
    roll,
  };
}

export function validateNarrative(raw: unknown): Record<string, Passage> | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return null;
  }

  const candidate = raw as Record<string, any>;

  // A valid narrative pack must have at least one passage, and ideally a 'start' node
  if (Object.keys(candidate).length === 0) {
    return null;
  }

  for (const passage of Object.values(candidate)) {
    if (
      typeof passage.id !== 'string' ||
      typeof passage.title !== 'string' ||
      typeof passage.text !== 'string' ||
      !Array.isArray(passage.choices)
    ) {
      return null;
    }
  }

  return candidate as Record<string, Passage>;
}

export function getInitialStoryPassages(): Record<string, Passage> {
  const custom = localStorage.getItem(CUSTOM_STORY_STORAGE_KEY);
  if (custom) {
    try {
      const parsed = JSON.parse(custom);
      const validated = validateNarrative(parsed);
      if (validated) return validated;
    } catch {
      console.warn('Failed to parse custom narrative. Falling back to default.');
    }
  }
  return STORY_PASSAGES;
}