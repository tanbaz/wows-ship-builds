/**
 * Enrich builds-data.json with ship_name, ship_tier, ship_nation
 * by matching h3_title to known ship data.
 *
 * For single-ship entries: direct match by name
 * For line builds: use the representative top-tier ship
 *
 * Usage: node enrich-ship-metadata.js [--dry-run]
 */
const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, 'builds-data.json');
const builds = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
const dryRun = process.argv.includes('--dry-run');

// ── Ship database (from seed-ships.js + additional ships for builds) ──

const SHIPS = {
  // === Destroyers ===
  'Harugumo': { tier: 10, nation: 'Japan', type: 'Destroyer' },
  'Hayate': { tier: 10, nation: 'Japan', type: 'Destroyer' },
  'Shimakaze': { tier: 10, nation: 'Japan', type: 'Destroyer' },
  'Gearing': { tier: 10, nation: 'USA', type: 'Destroyer' },
  'Burrows': { tier: 10, nation: 'USA', type: 'Destroyer' },
  'Forrest Sherman': { tier: 10, nation: 'USA', type: 'Destroyer' },
  'Delny': { tier: 10, nation: 'USSR', type: 'Destroyer' },
  'Grozovoi': { tier: 10, nation: 'USSR', type: 'Destroyer' },
  'Ognevoi': { tier: 8, nation: 'USSR', type: 'Destroyer' },
  'Z-52': { tier: 10, nation: 'Germany', type: 'Destroyer' },
  'Z-42': { tier: 10, nation: 'Germany', type: 'Destroyer' },
  'Elbing': { tier: 10, nation: 'Germany', type: 'Destroyer' },
  'Georg Hoffmann': { tier: 10, nation: 'Germany', type: 'Destroyer' },
  'Daring': { tier: 10, nation: 'UK', type: 'Destroyer' },
  'Druid': { tier: 10, nation: 'UK', type: 'Destroyer' },
  'Kléber': { tier: 10, nation: 'France', type: 'Destroyer' },
  'Marceau': { tier: 10, nation: 'France', type: 'Destroyer' },
  'Cassard': { tier: 10, nation: 'France', type: 'Destroyer' },
  'Yue Yang': { tier: 10, nation: 'Pan-Asia', type: 'Destroyer' },
  'Lüshun': { tier: 10, nation: 'Pan-Asia', type: 'Destroyer' },
  'Halland': { tier: 10, nation: 'Europe', type: 'Destroyer' },
  'Dalarna': { tier: 10, nation: 'Europe', type: 'Destroyer' },
  'Gdansk': { tier: 10, nation: 'Europe', type: 'Destroyer' },
  'Småland': { tier: 10, nation: 'Europe', type: 'Destroyer' },
  'Ragnar': { tier: 10, nation: 'Europe', type: 'Destroyer' },
  'Attilio Regolo': { tier: 10, nation: 'Italy', type: 'Destroyer' },
  'Vampire II': { tier: 10, nation: 'Commonwealth', type: 'Destroyer' },
  'Tromp': { tier: 10, nation: 'Netherlands', type: 'Destroyer' },
  'Álvaro de Bazán': { tier: 10, nation: 'Spain', type: 'Destroyer' },
  'La Pampa': { tier: 10, nation: 'Pan-America', type: 'Destroyer' },
  // Premium/Special Destroyers
  'Gallant': { tier: 6, nation: 'UK', type: 'Destroyer' },
  'Karl von Schönberg': { tier: 8, nation: 'Germany', type: 'Destroyer' },
  'Leone': { tier: 6, nation: 'Italy', type: 'Destroyer' },
  'FR25': { tier: 6, nation: 'France', type: 'Destroyer' },
  'Anshan': { tier: 6, nation: 'Pan-Asia', type: 'Destroyer' },
  "Tashkent '39": { tier: 8, nation: 'USSR', type: 'Destroyer' },
  "Jupiter '42": { tier: 7, nation: 'UK', type: 'Destroyer' },
  'Haida': { tier: 7, nation: 'Commonwealth', type: 'Destroyer' },
  'Huron': { tier: 7, nation: 'Commonwealth', type: 'Destroyer' },
  'Blyskawica': { tier: 7, nation: 'Europe', type: 'Destroyer' },
  "Stord '43": { tier: 7, nation: 'Europe', type: 'Destroyer' },
  'Kidd': { tier: 8, nation: 'USA', type: 'Destroyer' },
  'Orkan': { tier: 8, nation: 'Europe', type: 'Destroyer' },
  'Fenyang': { tier: 8, nation: 'Pan-Asia', type: 'Destroyer' },
  'Loyang': { tier: 8, nation: 'Pan-Asia', type: 'Destroyer' },
  'Siliwangi': { tier: 8, nation: 'Pan-Asia', type: 'Destroyer' },
  'Black': { tier: 9, nation: 'USA', type: 'Destroyer' },
  'Halford': { tier: 7, nation: 'USA', type: 'Destroyer' },
  'Johnston': { tier: 7, nation: 'USA', type: 'Destroyer' },
  'Velos': { tier: 8, nation: 'Europe', type: 'Destroyer' },
  'Jäger': { tier: 9, nation: 'Germany', type: 'Destroyer' },
  'Friesland': { tier: 9, nation: 'Europe', type: 'Destroyer' },
  'Neustrashimy': { tier: 9, nation: 'USSR', type: 'Destroyer' },
  'ZF-6': { tier: 9, nation: 'Germany', type: 'Destroyer' },
  'Z-44': { tier: 9, nation: 'Germany', type: 'Destroyer' },
  'Eskimo': { tier: 7, nation: 'Commonwealth', type: 'Destroyer' },
  'Alberico da Barbiano': { tier: 8, nation: 'Italy', type: 'Destroyer' },
  'Provorny': { tier: 10, nation: 'USSR', type: 'Destroyer' },
  "Błyskawica '44": { tier: 8, nation: 'Europe', type: 'Destroyer' },
  "Błyskawica '52": { tier: 8, nation: 'Europe', type: 'Destroyer' },
  'Nanning': { tier: 8, nation: 'Pan-Asia', type: 'Destroyer' },
  'Hull': { tier: 7, nation: 'USA', type: 'Destroyer' },
  'Laffey': { tier: 8, nation: 'USA', type: 'Destroyer' },

  // === Cruisers ===
  'Zao': { tier: 10, nation: 'Japan', type: 'Cruiser' },
  'Yodo': { tier: 10, nation: 'Japan', type: 'Cruiser' },
  'Azuma': { tier: 9, nation: 'Japan', type: 'Cruiser' },
  'Yoshino': { tier: 10, nation: 'Japan', type: 'Cruiser' },
  'Kitakami': { tier: 10, nation: 'Japan', type: 'Cruiser' },
  'Des Moines': { tier: 10, nation: 'USA', type: 'Cruiser' },
  'Salem': { tier: 10, nation: 'USA', type: 'Cruiser' },
  'Worcester': { tier: 10, nation: 'USA', type: 'Cruiser' },
  'Austin': { tier: 10, nation: 'USA', type: 'Cruiser' },
  'Petropavlovsk': { tier: 10, nation: 'USSR', type: 'Cruiser' },
  'Sevastopol': { tier: 10, nation: 'USSR', type: 'Cruiser' },
  'Moskva': { tier: 10, nation: 'USSR', type: 'Cruiser' },
  'Nevsky': { tier: 10, nation: 'USSR', type: 'Cruiser' },
  'Smolensk': { tier: 10, nation: 'USSR', type: 'Cruiser' },
  'Komissar': { tier: 10, nation: 'USSR', type: 'Cruiser' },
  'Hindenburg': { tier: 10, nation: 'Germany', type: 'Cruiser' },
  'Adalbert': { tier: 10, nation: 'Germany', type: 'Cruiser' },
  'Hildebrand': { tier: 10, nation: 'Germany', type: 'Cruiser' },
  'Minotaur': { tier: 10, nation: 'UK', type: 'Cruiser' },
  'Edgar': { tier: 10, nation: 'UK', type: 'Cruiser' },
  'Plymouth': { tier: 10, nation: 'UK', type: 'Cruiser' },
  'Goliath': { tier: 10, nation: 'UK', type: 'Cruiser' },
  'Gibraltar': { tier: 10, nation: 'UK', type: 'Cruiser' },
  'Cerberus': { tier: 10, nation: 'Commonwealth', type: 'Cruiser' },
  'Brisbane': { tier: 10, nation: 'Commonwealth', type: 'Cruiser' },
  'Henri IV': { tier: 10, nation: 'France', type: 'Cruiser' },
  'Colbert': { tier: 10, nation: 'France', type: 'Cruiser' },
  'Marseille': { tier: 10, nation: 'France', type: 'Cruiser' },
  'Venezia': { tier: 10, nation: 'Italy', type: 'Cruiser' },
  'Napoli': { tier: 10, nation: 'Italy', type: 'Cruiser' },
  'Varese': { tier: 10, nation: 'Italy', type: 'Cruiser' },
  'Jinan': { tier: 10, nation: 'Pan-Asia', type: 'Cruiser' },
  'Svea': { tier: 10, nation: 'Europe', type: 'Cruiser' },
  'Gouden Leeuw': { tier: 10, nation: 'Netherlands', type: 'Cruiser' },
  'Prins van Oranje': { tier: 10, nation: 'Netherlands', type: 'Cruiser' },
  'Utrecht': { tier: 10, nation: 'Netherlands', type: 'Cruiser' },
  'San Martin': { tier: 10, nation: 'Pan-America', type: 'Cruiser' },
  'Castilla': { tier: 10, nation: 'Spain', type: 'Cruiser' },
  // Premium/Special Cruisers
  'Yuubari': { tier: 4, nation: 'Japan', type: 'Cruiser' },
  'Dido': { tier: 6, nation: 'UK', type: 'Cruiser' },
  'Huanghe': { tier: 6, nation: 'Pan-Asia', type: 'Cruiser' },
  'Canarias': { tier: 6, nation: 'Spain', type: 'Cruiser' },
  'Elli': { tier: 5, nation: 'Europe', type: 'Cruiser' },
  'Atlanta': { tier: 7, nation: 'USA', type: 'Cruiser' },
  'Flint': { tier: 7, nation: 'USA', type: 'Cruiser' },
  'Maya': { tier: 7, nation: 'Japan', type: 'Cruiser' },
  'Tokachi': { tier: 7, nation: 'Japan', type: 'Cruiser' },
  'Weimar': { tier: 7, nation: 'Germany', type: 'Cruiser' },
  "Nurnberg '44": { tier: 6, nation: 'Germany', type: 'Cruiser' },
  'Francesco Ferrucio': { tier: 7, nation: 'Italy', type: 'Cruiser' },
  'Nueve de Julio': { tier: 7, nation: 'Pan-America', type: 'Cruiser' },
  'Lanzhou': { tier: 7, nation: 'Pan-Asia', type: 'Cruiser' },
  'San Diego': { tier: 8, nation: 'USA', type: 'Cruiser' },
  'Bagration': { tier: 8, nation: 'USSR', type: 'Cruiser' },
  'Bayard': { tier: 8, nation: 'France', type: 'Cruiser' },
  'Mainz': { tier: 8, nation: 'Germany', type: 'Cruiser' },
  'Wiesbaden': { tier: 8, nation: 'Germany', type: 'Cruiser' },
  'Hampshire': { tier: 8, nation: 'UK', type: 'Cruiser' },
  'Wukong': { tier: 8, nation: 'Pan-Asia', type: 'Cruiser' },
  'De Zeven Provinciën': { tier: 8, nation: 'Netherlands', type: 'Cruiser' },
  'Almirante Grau': { tier: 8, nation: 'Pan-America', type: 'Cruiser' },
  'Narai': { tier: 8, nation: 'Japan', type: 'Cruiser' },
  'Chikuma II': { tier: 8, nation: 'Japan', type: 'Cruiser' },
  'Tone': { tier: 8, nation: 'Japan', type: 'Cruiser' },
  'Vallejo': { tier: 9, nation: 'USA', type: 'Cruiser' },
  'Kozma Minin': { tier: 9, nation: 'USSR', type: 'Cruiser' },
  'Admiral Schröder': { tier: 9, nation: 'Germany', type: 'Cruiser' },
  'Carnot': { tier: 9, nation: 'France', type: 'Cruiser' },
  'La Havre': { tier: 9, nation: 'France', type: 'Cruiser' },
  'Dalian': { tier: 9, nation: 'Pan-Asia', type: 'Cruiser' },
  'Tianjin': { tier: 9, nation: 'Pan-Asia', type: 'Cruiser' },
  'Hector': { tier: 9, nation: 'UK', type: 'Cruiser' },
  'Incheon': { tier: 9, nation: 'Pan-Asia', type: 'Cruiser' },
  'Ferrante Gonzaga': { tier: 9, nation: 'Italy', type: 'Cruiser' },
  'Monmouth': { tier: 8, nation: 'UK', type: 'Cruiser' },
  'Suzuya': { tier: 8, nation: 'Japan', type: 'Cruiser' },
  'Blucher': { tier: 8, nation: 'Germany', type: 'Cruiser' },
  'Gambia': { tier: 7, nation: 'Commonwealth', type: 'Cruiser' },
  'Bridgeport': { tier: 8, nation: 'USA', type: 'Cruiser' },
  'Cambridge': { tier: 9, nation: 'UK', type: 'Cruiser' },
  'Hawaii': { tier: 9, nation: 'USA', type: 'Cruiser' },
  'Bremen': { tier: 7, nation: 'Germany', type: 'Cruiser' },
  'Dimitry Pozharsky': { tier: 8, nation: 'USSR', type: 'Cruiser' },

  // === Battleships ===
  'Yamato': { tier: 10, nation: 'Japan', type: 'Battleship' },
  'Bungo': { tier: 10, nation: 'Japan', type: 'Battleship' },
  'Montana': { tier: 10, nation: 'USA', type: 'Battleship' },
  'Vermont': { tier: 10, nation: 'USA', type: 'Battleship' },
  'Kearsarge': { tier: 9, nation: 'USA', type: 'Battleship' },
  'Ohio': { tier: 10, nation: 'USA', type: 'Battleship' },
  'Rhode Island': { tier: 10, nation: 'USA', type: 'Battleship' },
  'Wisconsin': { tier: 10, nation: 'USA', type: 'Battleship' },
  'Thunderer': { tier: 10, nation: 'UK', type: 'Battleship' },
  'Conqueror': { tier: 10, nation: 'UK', type: 'Battleship' },
  'St. Vincent': { tier: 10, nation: 'UK', type: 'Battleship' },
  'Slava': { tier: 10, nation: 'USSR', type: 'Battleship' },
  'Kremlin': { tier: 10, nation: 'USSR', type: 'Battleship' },
  'Preussen': { tier: 10, nation: 'Germany', type: 'Battleship' },
  'Schlieffen': { tier: 10, nation: 'Germany', type: 'Battleship' },
  'Mecklenburg': { tier: 10, nation: 'Germany', type: 'Battleship' },
  'République': { tier: 10, nation: 'France', type: 'Battleship' },
  'Colombo': { tier: 10, nation: 'Italy', type: 'Battleship' },
  'Sicilia': { tier: 9, nation: 'Italy', type: 'Battleship' },
  'Libertad': { tier: 10, nation: 'Pan-America', type: 'Battleship' },
  'Thor': { tier: 10, nation: 'Europe', type: 'Battleship' },
  // Premium/Special Battleships
  'Mikasa': { tier: 2, nation: 'Japan', type: 'Battleship' },
  'Agincourt': { tier: 5, nation: 'UK', type: 'Battleship' },
  'Rio de Janeiro': { tier: 5, nation: 'Pan-America', type: 'Battleship' },
  'Repulse': { tier: 6, nation: 'UK', type: 'Battleship' },
  'Ise': { tier: 6, nation: 'Japan', type: 'Battleship' },
  'Lugdunum': { tier: 6, nation: 'France', type: 'Battleship' },
  'Arkhangelsk': { tier: 5, nation: 'USSR', type: 'Battleship' },
  'Teng She': { tier: 7, nation: 'Pan-Asia', type: 'Battleship' },
  'Odin': { tier: 8, nation: 'Germany', type: 'Battleship' },
  'Brandenburg': { tier: 8, nation: 'Germany', type: 'Battleship' },
  'Anhalt': { tier: 8, nation: 'Germany', type: 'Battleship' },
  'Roma': { tier: 8, nation: 'Italy', type: 'Battleship' },
  'Champagne': { tier: 8, nation: 'France', type: 'Battleship' },
  'Picardie': { tier: 8, nation: 'France', type: 'Battleship' },
  'Atlântico': { tier: 8, nation: 'Pan-America', type: 'Battleship' },
  'Giuseppe Verdi': { tier: 8, nation: 'Italy', type: 'Battleship' },
  'Daisen': { tier: 8, nation: 'Japan', type: 'Battleship' },
  'Georgia': { tier: 9, nation: 'USA', type: 'Battleship' },
  'Illinois': { tier: 9, nation: 'USA', type: 'Battleship' },
  'Navarin': { tier: 9, nation: 'USSR', type: 'Battleship' },
  'Karl XIV Johan': { tier: 9, nation: 'Europe', type: 'Battleship' },
  'Niord': { tier: 9, nation: 'Europe', type: 'Battleship' },
  'Victoria': { tier: 9, nation: 'UK', type: 'Battleship' },
  'Taihang': { tier: 9, nation: 'Pan-Asia', type: 'Battleship' },
  'Valparaiso': { tier: 9, nation: 'Pan-America', type: 'Battleship' },
  'Roussillion': { tier: 9, nation: 'France', type: 'Battleship' },
  'Willem De Eerste': { tier: 9, nation: 'Netherlands', type: 'Battleship' },
  'Irresistible': { tier: 9, nation: 'UK', type: 'Battleship' },
  'Sibir': { tier: 9, nation: 'USSR', type: 'Battleship' },
  'Aki': { tier: 9, nation: 'Japan', type: 'Battleship' },

  // === Aircraft Carriers ===
  'Hakuryū': { tier: 10, nation: 'Japan', type: 'AirCarrier' },
  'Shinano': { tier: 10, nation: 'Japan', type: 'AirCarrier' },
  'Midway': { tier: 10, nation: 'USA', type: 'AirCarrier' },
  'United States': { tier: 10, nation: 'USA', type: 'AirCarrier' },
  'Essex': { tier: 9, nation: 'USA', type: 'AirCarrier' },
  'Franklin D. Roosevelt': { tier: 10, nation: 'USA', type: 'AirCarrier' },
  'Manfred von Richthofen': { tier: 10, nation: 'Germany', type: 'AirCarrier' },
  'Max Immelmann': { tier: 10, nation: 'Germany', type: 'AirCarrier' },
  'Audacious': { tier: 10, nation: 'UK', type: 'AirCarrier' },
  'Malta': { tier: 10, nation: 'UK', type: 'AirCarrier' },
  'Eagle': { tier: 10, nation: 'UK', type: 'AirCarrier' },
  'Nakhimov': { tier: 10, nation: 'USSR', type: 'AirCarrier' },
  // Premium/Special CVs
  'E. Löwenhardt': { tier: 6, nation: 'Germany', type: 'AirCarrier' },
  'Béarn': { tier: 6, nation: 'France', type: 'AirCarrier' },
  'Hornet': { tier: 8, nation: 'USA', type: 'AirCarrier' },
  'Colossus': { tier: 6, nation: 'UK', type: 'AirCarrier' },
  'Indomitable': { tier: 8, nation: 'UK', type: 'AirCarrier' },
  'Theseus': { tier: 6, nation: 'UK', type: 'AirCarrier' },
  'Aquila': { tier: 6, nation: 'Italy', type: 'AirCarrier' },

  // === Submarines ===
  'U-4501': { tier: 10, nation: 'Germany', type: 'Submarine' },
  'U-2501': { tier: 8, nation: 'Germany', type: 'Submarine' },
  'Gato': { tier: 10, nation: 'USA', type: 'Submarine' },
  'Archerfish': { tier: 10, nation: 'USA', type: 'Submarine' },
  'Alliance': { tier: 10, nation: 'UK', type: 'Submarine' },
  'I-56': { tier: 8, nation: 'Japan', type: 'Submarine' },
  'Xin Zhong Guo 14': { tier: 8, nation: 'Pan-Asia', type: 'Submarine' },
  'S-189': { tier: 8, nation: 'USSR', type: 'Submarine' },
  'Seal': { tier: 6, nation: 'UK', type: 'Submarine' },
};

// ── Special title-to-ship mappings for line builds and compound names ──

const TITLE_MAP = {
  // Line builds → representative top-tier ship
  'IJN gunboat DDs (Harugumo Line)':     'Harugumo',
  'IJN torpedoboat DDs (Shimakaze Line)': 'Shimakaze',
  'USN Universal-type DDs (Gearing Line)':'Gearing',
  'USN Gunboat DDs (Burrows Line)':       'Burrows',
  'VMF (Soviet) Gunboat DDs (Delny Line)':'Delny',
  'VMF universal-type DDs (Grozovoi Line)':'Grozovoi',
  'KM (German) universal-type DDs (Z-52 line)':'Z-52',
  'KM gunboat DDs (Elbing Line)':         'Elbing',
  'RN DDs (Daring Line)':                 'Daring',
  'FR gunboat DDs (Kleber Line)':         'Kléber',
  'FR torpedoboat DDs (Cassard Line)':    'Cassard',
  'PA DDs (Yue Yang Line)':               'Yue Yang',
  'EU torpedoboat DDs (Halland line)':    'Halland',
  'EU Gunboat DDs (Gdansk line)':         'Gdansk',
  'Italian DDs (Attilio Regolo Line)':    'Attilio Regolo',
  'Halland Unique Upgrade':               'Halland',

  'IJN CAs (Zao line)':                   'Zao',
  'IJN CLs (Yodo Line)':                  'Yodo',
  'USN CAs (Des Moines Line)':            'Des Moines',
  'USN CLs (Worcester Line)':             'Worcester',
  'VMF CAs (Petropavlovsk Line)':         'Petropavlovsk',
  'VMF CLs (Nevsky Line)':                'Nevsky',
  'KM Hindenburg CAs Line':               'Hindenburg',
  'KM Adalbert Line':                     'Adalbert',
  'RN CLs (Minotaur Line)':               'Minotaur',
  'RN CAs (Goliath Line)':                'Goliath',
  'Commonwealth CAs (Cerberus line)':     'Cerberus',
  'FR CAs (Henri IV Line)':               'Henri IV',
  'FR Large Cruisers (Marseille Line)':   'Marseille',
  'Italian CAs(Venezia Line)':            'Venezia',
  'Leg Mod Venezia':                      'Venezia',
  'Pan-Asian CLs':                        'Jinan',
  'NL CAs (Goulden Leeuw Line)':         'Gouden Leeuw',
  'NL CLs (Utrecht Line)':               'Utrecht',
  'Pan-American CLs (San Martin Line)':   'San Martin',
  'ES CAs (Castilla Line)':              'Castilla',

  'IJN BBs (Yamato Line)':               'Yamato',
  'IJN BCs (Bungo Line)':                'Bungo',
  'USN fast BBs (Montana Line)':         'Montana',
  'USN super-dreadnought BBs (Vermont Line)':'Vermont',
  'USN hybrid BBs':                       'Kearsarge',
  'RN BBs (Conqueror Line)':             'Conqueror',
  'RN BCs (St. Vincent Line)':           'St. Vincent',
  'VMF BBs (Kremlin Line)':              'Kremlin',
  'KM BBs (Preussen Line)':              'Preussen',
  'KM BCs (Schlieffen Line)':            'Schlieffen',
  'FR BB tree (Republique Line) and some premiums':'République',
  'Italian BBs':                          'Colombo',
  'Pan-American BBs (Libertad Line)':    'Libertad',
  'Pan EU BB line (Thor Line)':          'Thor',

  'IJN CVs':                              'Hakuryū',
  'USN CVs':                              'Midway',
  'USN alternative CVs (Essex Line)':     'Essex',
  'KM CVs':                               'Manfred von Richthofen',
  'RN CVs':                               'Audacious',
  'VMF CVs':                              'Nakhimov',

  'KM sub build':                         'U-4501',
  'USN sub build':                        'Gato',
  'RN submarine build':                   'Alliance',
  'K-1 S-1 and L-20 (Soviet Submarines)':'S-189',

  // Compound ship names
  'Azuma/Yoshino':                        'Yoshino',
  'Gallant/Jurua':                        'Gallant',
  'Atlanta, Flint':                       'Atlanta',
  'Mikasa, Agincourt':                    'Mikasa',
  'Bagration, Molotov, Kirov, Mikoyan':   'Bagration',
  'Friesland/Groningen':                  'Friesland',
  'Chikuma II, Tone':                     'Chikuma II',
  'Giuseppe Verdi/M.Colonna/BA Binah':    'Giuseppe Verdi',
  "La Havre/BA Utnapishtim's Ship":       'La Havre',
};

// ── Normalize curly quotes for matching ──

function normQ(s) {
  return s.replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"');
}

// Build normalized lookup maps
const TITLE_MAP_NORM = {};
for (const [k, v] of Object.entries(TITLE_MAP)) TITLE_MAP_NORM[normQ(k)] = v;
const SHIPS_NORM = {};
for (const [k, v] of Object.entries(SHIPS)) SHIPS_NORM[normQ(k)] = { ...v, originalName: k };

// ── Main enrichment logic ──

let matched = 0, unmatched = 0;

for (const build of builds) {
  const title = build.h3_title;
  const titleNorm = normQ(title);

  // 1. Check explicit title map first
  let shipName = TITLE_MAP_NORM[titleNorm];

  // 2. If not in map, try direct lookup in SHIPS db
  if (!shipName && SHIPS_NORM[titleNorm]) {
    shipName = SHIPS_NORM[titleNorm].originalName;
  }

  // 3. If still not found, it's unmatched
  if (!shipName || !SHIPS[shipName]) {
    console.log(`UNMATCHED: "${title}" → shipName: "${shipName || '???'}"`);
    unmatched++;
    continue;
  }

  const ship = SHIPS[shipName];
  build.ship_name = shipName;
  build.ship_tier = ship.tier;
  build.ship_nation = ship.nation;
  matched++;

  if (dryRun) {
    console.log(`  ${title} → ${shipName} (T${ship.tier} ${ship.nation})`);
  }
}

console.log(`\n=== Results ===`);
console.log(`Matched: ${matched}`);
console.log(`Unmatched: ${unmatched}`);
console.log(`Total: ${builds.length}`);

if (!dryRun && unmatched === 0) {
  fs.writeFileSync(dataPath, JSON.stringify(builds, null, 2));
  console.log('\nWrote enriched metadata to builds-data.json');
} else if (!dryRun && unmatched > 0) {
  console.log('\nFix unmatched entries before writing. Use --dry-run to preview.');
} else {
  console.log('\nDRY RUN — no files written');
}
