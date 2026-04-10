// Eberron's 11 constellations — draconic gods placed by the Progenitors.
// Each constellation is a set of stars at fixed celestial coordinates (RA 0-360°, declination -90° to +90°)
// with line connections and a label. Stars on the celestial sphere rotate with the planet.
//
// Holy symbols from published D&D sources were simplified into connect-the-dots patterns.
// No canon defines the actual star patterns, so these are original designs.

export type ConstellationStar = {
  ra: number;       // right ascension in degrees (0-360), like celestial longitude
  dec: number;      // declination in degrees (-90 to +90), like celestial latitude
  bright: boolean;  // true = alpha/anchor star (larger, with diffraction cross)
};

export type Constellation = {
  name: string;
  domain: string;
  stars: ConstellationStar[];
  lines: [number, number][]; // pairs of star indices to connect
  tint: [number, number, number]; // RGB accent color for this constellation's stars
};

// Design constraints:
// - Io near celestial north pole (circumpolar, always visible) — the creator watches everything
// - Bahamut and Tiamat ~180° apart in RA — never visible simultaneously
// - Chronepsis on celestial equator — the Eye peers through the Ring of Siberys
// - Tamara and Falazure roughly opposite — life and death
// - Garyx at low declination — often half below the horizon, fire threatening to rise
// - 5-7 constellations visible at any given time

export var EBERRON_CONSTELLATIONS: Constellation[] = [
  {
    name: 'Io',
    domain: 'Creation & Magic',
    tint: [255, 245, 210],
    // Coiled dragon biting its tail (ouroboros) — largest constellation, near north celestial pole
    stars: [
      { ra: 0,   dec: 68, bright: true },   // 0: head/mouth (alpha)
      { ra: 25,  dec: 72, bright: false },   // 1: upper jaw
      { ra: 345, dec: 64, bright: false },   // 2: lower jaw
      { ra: 50,  dec: 70, bright: false },   // 3: neck
      { ra: 80,  dec: 62, bright: false },   // 4: shoulder
      { ra: 110, dec: 55, bright: false },   // 5: back
      { ra: 140, dec: 52, bright: true },    // 6: mid-body (bright)
      { ra: 175, dec: 55, bright: false },   // 7: haunch
      { ra: 210, dec: 60, bright: false },   // 8: hip
      { ra: 240, dec: 65, bright: false },   // 9: tail curve
      { ra: 270, dec: 68, bright: false },   // 10: tail mid
      { ra: 300, dec: 70, bright: false },   // 11: tail tip
      { ra: 330, dec: 68, bright: false },   // 12: tail end (approaches mouth)
      { ra: 350, dec: 68, bright: false },   // 13: near mouth
    ],
    lines: [[0,1],[1,3],[3,4],[4,5],[5,6],[6,7],[7,8],[8,9],[9,10],[10,11],[11,12],[12,13],[13,2],[2,0]]
  },
  {
    name: 'Tiamat',
    domain: 'Greed & Chromatic Dragons',
    tint: [255, 210, 200],
    // Five lines fanning from a central star — five dragon heads
    stars: [
      { ra: 90,  dec: 10, bright: true },    // 0: body center (alpha)
      { ra: 75,  dec: 30, bright: false },   // 1: head 1 (leftmost)
      { ra: 82,  dec: 32, bright: true },    // 2: head 2
      { ra: 90,  dec: 35, bright: false },   // 3: head 3 (center)
      { ra: 98,  dec: 32, bright: false },   // 4: head 4
      { ra: 105, dec: 30, bright: true },    // 5: head 5 (rightmost)
      { ra: 80,  dec: 5,  bright: false },   // 6: left wing tip
      { ra: 100, dec: 5,  bright: false },   // 7: right wing tip
      { ra: 85,  dec: 15, bright: false },   // 8: left shoulder
      { ra: 95,  dec: 15, bright: false },   // 9: right shoulder
      { ra: 90,  dec: -2, bright: false },   // 10: tail
      { ra: 90,  dec: -8, bright: false },   // 11: tail tip
    ],
    lines: [[0,1],[0,2],[0,3],[0,4],[0,5],[0,8],[0,9],[8,6],[9,7],[0,10],[10,11]]
  },
  {
    name: 'Bahamut',
    domain: 'Justice & Metallic Dragons',
    tint: [220, 235, 255],
    // Noble dragon in profile with spread wings — ~180° from Tiamat
    stars: [
      { ra: 270, dec: 15, bright: true },    // 0: head (alpha — pole star candidate)
      { ra: 265, dec: 12, bright: false },   // 1: jaw
      { ra: 260, dec: 18, bright: false },   // 2: crown
      { ra: 255, dec: 14, bright: false },   // 3: neck
      { ra: 248, dec: 10, bright: false },   // 4: chest
      { ra: 240, dec: 12, bright: true },    // 5: body center
      { ra: 232, dec: 10, bright: false },   // 6: haunch
      { ra: 225, dec: 5,  bright: false },   // 7: tail start
      { ra: 218, dec: 2,  bright: false },   // 8: tail tip
      { ra: 250, dec: 25, bright: false },   // 9: left wing tip
      { ra: 235, dec: 22, bright: false },   // 10: left wing elbow
      { ra: 250, dec: 2,  bright: false },   // 11: right wing tip (below)
      { ra: 240, dec: 4,  bright: false },   // 12: right wing elbow
    ],
    lines: [[0,1],[0,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,8],[3,9],[9,10],[10,5],[4,11],[11,12],[12,5]]
  },
  {
    name: 'Chronepsis',
    domain: 'Fate, Death & Judgment',
    tint: [200, 200, 220],
    // Unblinking draconic eye — sits on celestial equator, bisected by Ring of Siberys
    stars: [
      { ra: 180, dec: 3,  bright: true },    // 0: pupil center (alpha) — very bright, unblinking
      { ra: 172, dec: 5,  bright: false },   // 1: upper left lid
      { ra: 176, dec: 7,  bright: false },   // 2: upper lid peak
      { ra: 184, dec: 7,  bright: false },   // 3: upper right lid
      { ra: 188, dec: 5,  bright: false },   // 4: outer corner right
      { ra: 188, dec: 1,  bright: false },   // 5: lower right lid
      { ra: 184, dec: -1, bright: false },   // 6: lower lid
      { ra: 176, dec: -1, bright: false },   // 7: lower left lid
      { ra: 172, dec: 1,  bright: false },   // 8: outer corner left
    ],
    lines: [[8,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,8]]
  },
  {
    name: 'Aasterinian',
    domain: 'Trickery & Invention',
    tint: [255, 240, 200],
    // Grinning dragon head — open jaws
    stars: [
      { ra: 320, dec: 30, bright: true },    // 0: eye (alpha)
      { ra: 325, dec: 35, bright: false },   // 1: brow ridge
      { ra: 315, dec: 32, bright: false },   // 2: snout top
      { ra: 310, dec: 28, bright: false },   // 3: nose tip
      { ra: 312, dec: 24, bright: false },   // 4: upper jaw
      { ra: 318, dec: 22, bright: false },   // 5: jaw hinge
      { ra: 312, dec: 20, bright: false },   // 6: lower jaw
      { ra: 310, dec: 24, bright: false },   // 7: chin
      { ra: 328, dec: 28, bright: false },   // 8: back of head
      { ra: 325, dec: 24, bright: false },   // 9: neck
    ],
    lines: [[1,0],[0,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,3],[0,8],[8,9],[9,5]]
  },
  {
    name: 'Falazure',
    domain: 'Decay & Undeath',
    tint: [180, 195, 220],
    // Angular draconic skull — jagged, menacing. Roughly opposite Tamara.
    stars: [
      { ra: 35,  dec: 15, bright: true },    // 0: left eye socket (alpha)
      { ra: 45,  dec: 15, bright: true },    // 1: right eye socket
      { ra: 40,  dec: 22, bright: false },   // 2: forehead peak
      { ra: 33,  dec: 20, bright: false },   // 3: left temple
      { ra: 47,  dec: 20, bright: false },   // 4: right temple
      { ra: 40,  dec: 10, bright: false },   // 5: nasal ridge
      { ra: 37,  dec: 5,  bright: false },   // 6: left jaw
      { ra: 43,  dec: 5,  bright: false },   // 7: right jaw
      { ra: 40,  dec: 2,  bright: false },   // 8: chin
    ],
    lines: [[3,2],[2,4],[3,0],[0,5],[5,1],[1,4],[0,6],[6,8],[8,7],[7,1]]
  },
  {
    name: 'Garyx',
    domain: 'Fire, Destruction & Renewal',
    tint: [255, 200, 160],
    // Skull with flame rising — low declination, often half below horizon
    stars: [
      { ra: 145, dec: -5, bright: true },    // 0: skull center (alpha)
      { ra: 140, dec: -8, bright: false },   // 1: left jaw
      { ra: 150, dec: -8, bright: false },   // 2: right jaw
      { ra: 138, dec: 0,  bright: false },   // 3: left brow
      { ra: 152, dec: 0,  bright: false },   // 4: right brow
      { ra: 145, dec: 5,  bright: false },   // 5: flame base
      { ra: 142, dec: 12, bright: false },   // 6: left flame
      { ra: 145, dec: 15, bright: true },    // 7: flame peak
      { ra: 148, dec: 12, bright: false },   // 8: right flame
      { ra: 145, dec: -12, bright: false },  // 9: chin
    ],
    lines: [[3,0],[0,4],[3,1],[1,9],[9,2],[2,4],[3,5],[4,5],[5,6],[6,7],[7,8],[8,5]]
  },
  {
    name: 'Hlal',
    domain: 'Humor & Storytelling',
    tint: [245, 240, 225],
    // Open book — two angled lines meeting at a spine
    stars: [
      { ra: 200, dec: 40, bright: true },    // 0: spine center (alpha)
      { ra: 195, dec: 45, bright: false },   // 1: left page top
      { ra: 190, dec: 38, bright: false },   // 2: left page outer
      { ra: 195, dec: 35, bright: false },   // 3: left page bottom
      { ra: 205, dec: 45, bright: false },   // 4: right page top
      { ra: 210, dec: 38, bright: false },   // 5: right page outer
      { ra: 205, dec: 35, bright: false },   // 6: right page bottom
      { ra: 200, dec: 48, bright: false },   // 7: top of spine
    ],
    lines: [[7,1],[1,2],[2,3],[3,0],[7,4],[4,5],[5,6],[6,0]]
  },
  {
    name: 'Lendys',
    domain: 'Balance & Justice',
    tint: [235, 235, 245],
    // Sword balanced on a point — tallest, narrowest constellation
    stars: [
      { ra: 130, dec: 42, bright: true },    // 0: pommel (alpha)
      { ra: 130, dec: 38, bright: false },   // 1: grip
      { ra: 126, dec: 35, bright: false },   // 2: left crossguard
      { ra: 134, dec: 35, bright: false },   // 3: right crossguard
      { ra: 130, dec: 30, bright: false },   // 4: blade mid
      { ra: 130, dec: 22, bright: false },   // 5: blade lower
      { ra: 130, dec: 18, bright: true },    // 6: blade tip / balance point
    ],
    lines: [[0,1],[1,2],[1,3],[1,4],[4,5],[5,6]]
  },
  {
    name: 'Astilabor',
    domain: 'Hoarding & Acquisitiveness',
    tint: [255, 235, 190],
    // Curved claw clutching a bright gem star
    stars: [
      { ra: 60,  dec: 40, bright: true },    // 0: gem center (alpha) — brightest star
      { ra: 55,  dec: 45, bright: false },   // 1: claw tip 1
      { ra: 52,  dec: 40, bright: false },   // 2: claw knuckle 1
      { ra: 54,  dec: 35, bright: false },   // 3: claw base 1
      { ra: 65,  dec: 46, bright: false },   // 4: claw tip 2
      { ra: 67,  dec: 41, bright: false },   // 5: claw knuckle 2
      { ra: 65,  dec: 36, bright: false },   // 6: claw base 2
      { ra: 57,  dec: 48, bright: false },   // 7: claw tip 3
      { ra: 63,  dec: 49, bright: false },   // 8: claw tip 4
      { ra: 60,  dec: 34, bright: false },   // 9: palm
    ],
    lines: [[1,2],[2,3],[3,9],[4,5],[5,6],[6,9],[7,0],[8,0],[9,0]]
  },
  {
    name: 'Tamara',
    domain: 'Life, Light & Mercy',
    tint: [255, 230, 230],
    // Seven-pointed star (heptagram) — clean geometry among organic dragon shapes
    stars: [
      { ra: 220, dec: 28, bright: true },    // 0: top point (alpha)
      { ra: 228, dec: 25, bright: false },   // 1
      { ra: 230, dec: 17, bright: false },   // 2
      { ra: 225, dec: 12, bright: false },   // 3
      { ra: 215, dec: 12, bright: false },   // 4
      { ra: 210, dec: 17, bright: false },   // 5
      { ra: 212, dec: 25, bright: false },   // 6
    ],
    // Heptagram: connect every 3rd point (0→3→6→2→5→1→4→0)
    lines: [[0,3],[3,6],[6,2],[2,5],[5,1],[1,4],[4,0]]
  }
];

// Greyhawk's 12 Lairs of the Zodiac — one zodiac animal per month of the
// Common calendar. Distributed at 30° RA intervals along a near-ecliptic band
// with declinations between -10° and +50°. All constellations share a warm
// neutral white tint (no per-deity color coding).
export var GREYHAWK_CONSTELLATIONS: Constellation[] = [
  {
    name: 'Tiger',
    domain: 'Fireseek — Winter',
    tint: [240, 235, 225],
    // Crouching cat, long tail curving up
    stars: [
      { ra:   5, dec: 15, bright: true  }, // 0: nose
      { ra:   7, dec: 22, bright: false }, // 1: ear
      { ra:  12, dec: 22, bright: false }, // 2: shoulder
      { ra:  18, dec: 25, bright: false }, // 3: back
      { ra:  23, dec: 22, bright: false }, // 4: hip
      { ra:  25, dec: 10, bright: false }, // 5: rear paw
      { ra:  24, dec: 30, bright: false }, // 6: tail base
      { ra:  28, dec: 42, bright: false }, // 7: tail tip
      { ra:   9, dec:  8, bright: false }, // 8: front paw
      { ra:  15, dec: 13, bright: false }, // 9: belly
    ],
    lines: [[0,1],[0,2],[2,3],[3,4],[4,5],[4,6],[6,7],[2,8],[2,9],[9,4]]
  },
  {
    name: 'Bear',
    domain: 'Readying — Winter',
    tint: [240, 235, 225],
    // Standing bear in profile, broad body
    stars: [
      { ra: 38, dec: 45, bright: true  }, // 0: head
      { ra: 35, dec: 40, bright: false }, // 1: snout
      { ra: 40, dec: 52, bright: false }, // 2: ear
      { ra: 43, dec: 36, bright: false }, // 3: shoulder
      { ra: 42, dec: 18, bright: false }, // 4: front paw
      { ra: 52, dec: 16, bright: false }, // 5: rear paw
      { ra: 50, dec: 42, bright: false }, // 6: back
      { ra: 53, dec: 32, bright: false }, // 7: hip
      { ra: 47, dec: 26, bright: false }, // 8: belly
    ],
    lines: [[0,1],[0,2],[0,3],[3,4],[3,6],[6,7],[7,5],[3,8],[8,7]]
  },
  {
    name: 'Lion',
    domain: 'Coldeven — Spring',
    tint: [240, 235, 225],
    // Seated lion with mane radiating around head
    stars: [
      { ra: 75, dec: 35, bright: true  }, // 0: face
      { ra: 75, dec: 46, bright: false }, // 1: mane top
      { ra: 67, dec: 40, bright: false }, // 2: mane left
      { ra: 83, dec: 40, bright: false }, // 3: mane right
      { ra: 69, dec: 28, bright: false }, // 4: mane lower-left
      { ra: 81, dec: 28, bright: false }, // 5: mane lower-right
      { ra: 78, dec: 18, bright: false }, // 6: body
      { ra: 74, dec:  8, bright: false }, // 7: front paw
      { ra: 84, dec: 14, bright: false }, // 8: rear
      { ra: 89, dec: 20, bright: false }, // 9: tail
    ],
    lines: [[0,1],[0,2],[0,3],[0,4],[0,5],[0,6],[6,7],[6,8],[8,9]]
  },
  {
    name: 'Frog',
    domain: 'Planting — Spring',
    tint: [240, 235, 225],
    // Wide squat body, splayed legs
    stars: [
      { ra: 105, dec: 18, bright: true  }, // 0: head
      { ra: 101, dec: 22, bright: false }, // 1: left eye
      { ra: 109, dec: 22, bright: false }, // 2: right eye
      { ra: 105, dec:  8, bright: false }, // 3: body
      { ra:  97, dec:  6, bright: false }, // 4: front-left leg
      { ra: 113, dec:  6, bright: false }, // 5: front-right leg
      { ra:  95, dec: -2, bright: false }, // 6: back-left leg
      { ra: 115, dec: -2, bright: false }, // 7: back-right leg
    ],
    lines: [[0,1],[0,2],[0,3],[3,4],[3,5],[3,6],[3,7]]
  },
  {
    name: 'Turtle',
    domain: 'Flocktime — Spring',
    tint: [240, 235, 225],
    // Domed shell with head and four legs poking out
    stars: [
      { ra: 128, dec: 18, bright: true  }, // 0: head
      { ra: 135, dec: 27, bright: false }, // 1: shell top
      { ra: 143, dec: 18, bright: false }, // 2: shell back
      { ra: 135, dec:  8, bright: false }, // 3: shell bottom
      { ra: 131, dec:  2, bright: false }, // 4: front-left leg
      { ra: 138, dec:  2, bright: false }, // 5: front-right leg
      { ra: 142, dec: 10, bright: false }, // 6: rear-right leg
      { ra: 146, dec: 16, bright: false }, // 7: tail
    ],
    lines: [[0,1],[1,2],[2,7],[2,6],[2,3],[3,5],[3,4],[3,0]]
  },
  {
    name: 'Fox',
    domain: 'Wealsun — Summer',
    tint: [240, 235, 225],
    // Running fox profile with bushy tail
    stars: [
      { ra: 158, dec: 28, bright: true  }, // 0: snout
      { ra: 162, dec: 34, bright: false }, // 1: ear
      { ra: 163, dec: 28, bright: false }, // 2: head
      { ra: 167, dec: 24, bright: false }, // 3: shoulder
      { ra: 172, dec: 26, bright: false }, // 4: back
      { ra: 177, dec: 24, bright: false }, // 5: hip
      { ra: 180, dec: 29, bright: false }, // 6: tail base
      { ra: 184, dec: 38, bright: false }, // 7: tail tip
      { ra: 166, dec: 14, bright: false }, // 8: front paw
      { ra: 176, dec: 13, bright: false }, // 9: rear paw
    ],
    lines: [[0,2],[2,1],[2,3],[3,4],[4,5],[5,6],[6,7],[3,8],[5,9]]
  },
  {
    name: 'Snake',
    domain: 'Reaping — Summer',
    tint: [240, 235, 225],
    // Distinctive S-curve
    stars: [
      { ra: 188, dec: 26, bright: true  }, // 0: head
      { ra: 192, dec: 20, bright: false }, // 1: neck
      { ra: 196, dec: 12, bright: false }, // 2: upper curve
      { ra: 200, dec:  6, bright: false }, // 3: mid
      { ra: 205, dec:  2, bright: false }, // 4: lower curve
      { ra: 210, dec: -4, bright: false }, // 5: body
      { ra: 214, dec:-10, bright: false }, // 6: tail
    ],
    lines: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,6]]
  },
  {
    name: 'Boar',
    domain: 'Goodmonth — Summer',
    tint: [240, 235, 225],
    // Stocky body with tusks
    stars: [
      { ra: 218, dec: 20, bright: true  }, // 0: snout
      { ra: 215, dec: 17, bright: false }, // 1: tusk
      { ra: 222, dec: 25, bright: false }, // 2: head
      { ra: 224, dec: 32, bright: false }, // 3: ear
      { ra: 227, dec: 22, bright: false }, // 4: shoulder
      { ra: 232, dec: 25, bright: false }, // 5: back
      { ra: 236, dec: 20, bright: false }, // 6: hip
      { ra: 230, dec: 12, bright: false }, // 7: belly
      { ra: 239, dec: 24, bright: false }, // 8: tail
    ],
    lines: [[0,1],[0,2],[2,3],[2,4],[4,5],[5,6],[6,8],[4,7],[7,6]]
  },
  {
    name: 'Squirrel',
    domain: 'Harvester — Autumn',
    tint: [240, 235, 225],
    // Sitting upright with tail curved over back
    stars: [
      { ra: 252, dec: 38, bright: true  }, // 0: head
      { ra: 250, dec: 44, bright: false }, // 1: ear
      { ra: 253, dec: 30, bright: false }, // 2: body
      { ra: 256, dec: 23, bright: false }, // 3: front paws
      { ra: 251, dec: 20, bright: false }, // 4: rear
      { ra: 250, dec: 28, bright: false }, // 5: tail base
      { ra: 246, dec: 36, bright: false }, // 6: tail mid
      { ra: 248, dec: 46, bright: false }, // 7: tail tip
    ],
    lines: [[0,1],[0,2],[2,3],[2,4],[4,5],[5,6],[6,7]]
  },
  {
    name: 'Hare',
    domain: 'Patchwall — Autumn',
    tint: [240, 235, 225],
    // Leaping hare with long ears
    stars: [
      { ra: 280, dec: 28, bright: true  }, // 0: head
      { ra: 278, dec: 40, bright: false }, // 1: ear 1
      { ra: 282, dec: 40, bright: false }, // 2: ear 2
      { ra: 284, dec: 22, bright: false }, // 3: shoulder
      { ra: 288, dec: 26, bright: false }, // 4: back
      { ra: 293, dec: 22, bright: false }, // 5: hip
      { ra: 283, dec: 10, bright: false }, // 6: front leg
      { ra: 295, dec:  8, bright: false }, // 7: rear leg
      { ra: 297, dec: 24, bright: false }, // 8: tail
    ],
    lines: [[0,1],[0,2],[0,3],[3,4],[4,5],[5,8],[3,6],[5,7]]
  },
  {
    name: 'Falcon',
    domain: 'Ready\u2019reat — Autumn',
    tint: [240, 235, 225],
    // Wings spread in a dive — V shape with body
    stars: [
      { ra: 315, dec: 22, bright: true  }, // 0: body
      { ra: 315, dec: 32, bright: false }, // 1: head
      { ra: 307, dec: 30, bright: false }, // 2: left wing mid
      { ra: 300, dec: 40, bright: false }, // 3: left wing tip
      { ra: 323, dec: 30, bright: false }, // 4: right wing mid
      { ra: 330, dec: 40, bright: false }, // 5: right wing tip
      { ra: 315, dec: 10, bright: false }, // 6: tail
      { ra: 312, dec:  6, bright: false }, // 7: left talon
      { ra: 318, dec:  6, bright: false }, // 8: right talon
    ],
    lines: [[0,1],[0,2],[2,3],[0,4],[4,5],[0,6],[6,7],[6,8]]
  },
  {
    name: 'Wolf',
    domain: 'Sunsebb — Winter',
    tint: [240, 235, 225],
    // Howling wolf profile, head tilted up
    stars: [
      { ra: 338, dec: 32, bright: true  }, // 0: snout
      { ra: 342, dec: 26, bright: false }, // 1: head
      { ra: 340, dec: 36, bright: false }, // 2: ear
      { ra: 346, dec: 22, bright: false }, // 3: shoulder
      { ra: 351, dec: 24, bright: false }, // 4: back
      { ra: 356, dec: 22, bright: false }, // 5: hip
      { ra: 346, dec: 10, bright: false }, // 6: front leg
      { ra: 355, dec: 10, bright: false }, // 7: rear leg
      { ra: 359, dec: 26, bright: false }, // 8: tail
    ],
    lines: [[0,1],[1,2],[1,3],[3,4],[4,5],[5,8],[3,6],[5,7]]
  },
];

// Centroid of a constellation in celestial coordinates — used for label placement.
export function constellationCentroid(c: Constellation): { ra: number; dec: number } {
  var raSum = 0, decSum = 0;
  // Handle RA wraparound: convert to unit vectors, average, convert back
  var xSum = 0, ySum = 0;
  for (var i = 0; i < c.stars.length; i++) {
    var rad = c.stars[i].ra * Math.PI / 180;
    xSum += Math.cos(rad);
    ySum += Math.sin(rad);
    decSum += c.stars[i].dec;
  }
  var avgRa = ((Math.atan2(ySum, xSum) * 180 / Math.PI) + 360) % 360;
  return { ra: avgRa, dec: decSum / c.stars.length };
}
