// Nation data.
//
// Rights note: nation NAMES are used (names are not licensable marks), but the
// marbles are ORIGINAL abstract designs -- a two- or three-colour swirl in each
// nation's sporting palette, never a reproduction of a flag. Nothing in this
// file reproduces a flag, crest, badge or federation mark. See docs/10-rights.md.
//
// Fields: [code, name, confederation, pattern, colours...]
// Patterns are marble finishes, not flag layouts:
//   band   a single equatorial band
//   split  two hemispheres
//   swirl  a spiral of the accent colour
//   ring   a bold ring around a contrasting core
//   speck  a base colour flecked with the accent

const RAW = [
  // UEFA
  ['ESP', 'Spain', 'UEFA', 'band', '#c8102e', '#ffc72c'],
  ['FRA', 'France', 'UEFA', 'split', '#1b3a8c', '#ffffff', '#c8102e'],
  ['ENG', 'England', 'UEFA', 'ring', '#ffffff', '#c8102e'],
  ['POR', 'Portugal', 'UEFA', 'split', '#046a38', '#c8102e'],
  ['NED', 'Netherlands', 'UEFA', 'swirl', '#ff6b00', '#1b3a8c'],
  ['BEL', 'Belgium', 'UEFA', 'band', '#c8102e', '#111111', '#f2c200'],
  ['GER', 'Germany', 'UEFA', 'band', '#111111', '#f2c200', '#c8102e'],
  ['CRO', 'Croatia', 'UEFA', 'speck', '#ffffff', '#c8102e'],
  ['SUI', 'Switzerland', 'UEFA', 'ring', '#d52b1e', '#ffffff'],
  ['AUT', 'Austria', 'UEFA', 'band', '#ed2939', '#ffffff'],
  ['NOR', 'Norway', 'UEFA', 'split', '#ba0c2f', '#00205b'],
  ['SCO', 'Scotland', 'UEFA', 'swirl', '#0b3d7a', '#ffffff'],
  ['BIH', 'Bosnia & Herzegovina', 'UEFA', 'speck', '#002f6c', '#f2c200'],
  ['CZE', 'Czechia', 'UEFA', 'split', '#d7141a', '#11457e'],
  ['SWE', 'Sweden', 'UEFA', 'band', '#005293', '#fecb00'],
  ['TUR', 'Türkiye', 'UEFA', 'ring', '#e30a17', '#ffffff'],
  ['ITA', 'Italy', 'UEFA', 'band', '#1a3d8f', '#ffffff'],
  ['POL', 'Poland', 'UEFA', 'split', '#ffffff', '#dc143c'],
  ['UKR', 'Ukraine', 'UEFA', 'split', '#ffd700', '#0057b7'],
  ['WAL', 'Wales', 'UEFA', 'band', '#c8102e', '#00b140'],
  ['DEN', 'Denmark', 'UEFA', 'ring', '#c60c30', '#ffffff'],
  ['SRB', 'Serbia', 'UEFA', 'speck', '#c6363c', '#0c4076'],
  ['GRE', 'Greece', 'UEFA', 'band', '#0d5eaf', '#ffffff'],
  ['ROU', 'Romania', 'UEFA', 'swirl', '#fcd116', '#002b7f'],
  // CONMEBOL
  ['ARG', 'Argentina', 'CONMEBOL', 'band', '#75aadb', '#ffffff'],
  ['BRA', 'Brazil', 'CONMEBOL', 'ring', '#f7df26', '#00923f'],
  ['COL', 'Colombia', 'CONMEBOL', 'band', '#fcd116', '#003893', '#ce1126'],
  ['URU', 'Uruguay', 'CONMEBOL', 'swirl', '#74acdf', '#ffffff'],
  ['ECU', 'Ecuador', 'CONMEBOL', 'band', '#ffd100', '#0072ce', '#ef3340'],
  ['PAR', 'Paraguay', 'CONMEBOL', 'split', '#d52b1e', '#0038a8'],
  ['CHI', 'Chile', 'CONMEBOL', 'split', '#0039a6', '#d52b1e'],
  ['PER', 'Peru', 'CONMEBOL', 'band', '#ffffff', '#d91023'],
  ['BOL', 'Bolivia', 'CONMEBOL', 'band', '#007934', '#ffd100'],
  ['VEN', 'Venezuela', 'CONMEBOL', 'speck', '#7b1113', '#ffd100'],
  // CONCACAF
  ['CAN', 'Canada', 'CONCACAF', 'ring', '#d52b1e', '#ffffff'],
  ['MEX', 'Mexico', 'CONCACAF', 'split', '#006847', '#ce1126'],
  ['USA', 'United States', 'CONCACAF', 'band', '#ffffff', '#0a3161', '#b31942'],
  ['PAN', 'Panama', 'CONCACAF', 'speck', '#d21034', '#005293'],
  ['CUW', 'Curaçao', 'CONCACAF', 'swirl', '#002b7f', '#f9e814'],
  ['HAI', 'Haiti', 'CONCACAF', 'split', '#00209f', '#d21034'],
  ['CRC', 'Costa Rica', 'CONCACAF', 'band', '#002b7f', '#ce1126'],
  ['JAM', 'Jamaica', 'CONCACAF', 'swirl', '#009b3a', '#fed100'],
  ['HON', 'Honduras', 'CONCACAF', 'band', '#0073cf', '#ffffff'],
  // CAF
  ['MAR', 'Morocco', 'CAF', 'ring', '#c1272d', '#006233'],
  ['SEN', 'Senegal', 'CAF', 'band', '#00853f', '#fdef42', '#e31b23'],
  ['EGY', 'Egypt', 'CAF', 'band', '#ce1126', '#ffffff', '#111111'],
  ['ALG', 'Algeria', 'CAF', 'split', '#006233', '#ffffff'],
  ['TUN', 'Tunisia', 'CAF', 'ring', '#e70013', '#ffffff'],
  ['CIV', 'Côte d’Ivoire', 'CAF', 'band', '#f77f00', '#ffffff', '#009e60'],
  ['RSA', 'South Africa', 'CAF', 'swirl', '#007a4d', '#ffb612'],
  ['CPV', 'Cabo Verde', 'CAF', 'speck', '#003893', '#ffffff'],
  ['GHA', 'Ghana', 'CAF', 'band', '#ce1126', '#fcd116', '#006b3f'],
  ['COD', 'DR Congo', 'CAF', 'swirl', '#007fff', '#f7d618'],
  ['NGA', 'Nigeria', 'CAF', 'split', '#008751', '#ffffff'],
  ['CMR', 'Cameroon', 'CAF', 'band', '#007a5e', '#ce1126', '#fcd116'],
  // AFC
  ['JPN', 'Japan', 'AFC', 'ring', '#0b1e5b', '#ffffff'],
  ['IRN', 'IR Iran', 'AFC', 'band', '#239f40', '#ffffff', '#da0000'],
  ['KOR', 'Korea Republic', 'AFC', 'swirl', '#c60c30', '#003478'],
  ['AUS', 'Australia', 'AFC', 'speck', '#fdb913', '#00843d'],
  ['UZB', 'Uzbekistan', 'AFC', 'band', '#0099b5', '#ffffff', '#1eb53a'],
  ['QAT', 'Qatar', 'AFC', 'split', '#8a1538', '#ffffff'],
  ['KSA', 'Saudi Arabia', 'AFC', 'swirl', '#006c35', '#ffffff'],
  ['JOR', 'Jordan', 'AFC', 'band', '#007a3d', '#111111', '#ce1126'],
  ['IRQ', 'Iraq', 'AFC', 'band', '#ce1126', '#ffffff', '#111111'],
  ['UAE', 'United Arab Emirates', 'AFC', 'band', '#00732f', '#ffffff', '#ce1126'],
  ['OMA', 'Oman', 'AFC', 'split', '#c8102e', '#ffffff'],
  ['BHR', 'Bahrain', 'AFC', 'ring', '#ce1126', '#ffffff'],
  ['KUW', 'Kuwait', 'AFC', 'band', '#007a3d', '#ffffff', '#ce1126'],
  ['CHN', 'China PR', 'AFC', 'swirl', '#de2910', '#ffde00'],
  ['PRK', 'Korea DPR', 'AFC', 'band', '#024fa2', '#ffffff', '#ed1c27'],
  ['THA', 'Thailand', 'AFC', 'band', '#a51931', '#ffffff', '#2d2a4a'],
  ['VIE', 'Vietnam', 'AFC', 'ring', '#da251d', '#ffff00'],
  ['IDN', 'Indonesia', 'AFC', 'split', '#ce1126', '#ffffff'],
  ['MAS', 'Malaysia', 'AFC', 'band', '#010066', '#ffffff', '#cc0001'],
  ['SYR', 'Syria', 'AFC', 'band', '#ce1126', '#ffffff', '#111111'],
  ['PLE', 'Palestine', 'AFC', 'band', '#007a3d', '#ffffff', '#ce1126'],
  ['LBN', 'Lebanon', 'AFC', 'ring', '#ed1c24', '#ffffff'],
  ['IND', 'India', 'AFC', 'band', '#ff9933', '#ffffff', '#138808'],
  ['KGZ', 'Kyrgyz Republic', 'AFC', 'swirl', '#e8112d', '#ffef00'],
  ['TJK', 'Tajikistan', 'AFC', 'band', '#cc0000', '#ffffff', '#006600'],
  ['TKM', 'Turkmenistan', 'AFC', 'speck', '#00843d', '#ffffff'],
  ['HKG', 'Hong Kong, China', 'AFC', 'swirl', '#de2910', '#ffffff'],
  ['PHI', 'Philippines', 'AFC', 'band', '#0038a8', '#ce1126', '#fcd116'],
  ['SGP', 'Singapore', 'AFC', 'split', '#ed2939', '#ffffff'],
  ['MYA', 'Myanmar', 'AFC', 'band', '#fecb00', '#34b233', '#ea2839'],
  ['YEM', 'Yemen', 'AFC', 'band', '#ce1126', '#ffffff', '#111111'],
  ['AFG', 'Afghanistan', 'AFC', 'band', '#111111', '#d32011', '#007a36'],
  ['BAN', 'Bangladesh', 'AFC', 'ring', '#006a4e', '#f42a41'],
  ['MDV', 'Maldives', 'AFC', 'ring', '#d21034', '#007e3a'],
  ['NEP', 'Nepal', 'AFC', 'speck', '#dc143c', '#003893'],
  ['LAO', 'Laos', 'AFC', 'band', '#ce1126', '#002868', '#ffffff'],
  ['CAM', 'Cambodia', 'AFC', 'band', '#032ea1', '#e00025', '#ffffff'],
  ['TPE', 'Chinese Taipei', 'AFC', 'swirl', '#000095', '#fe0000'],
  ['MAC', 'Macau, China', 'AFC', 'swirl', '#00785e', '#ffffff'],
  ['BRU', 'Brunei Darussalam', 'AFC', 'band', '#f7e017', '#ffffff', '#111111'],
  ['TLS', 'Timor-Leste', 'AFC', 'split', '#dc241f', '#111111'],
  ['MNG', 'Mongolia', 'AFC', 'band', '#c4272f', '#015197', '#f9cf02'],
  ['GUM', 'Guam', 'AFC', 'ring', '#003da5', '#c5112e'],
  ['BHU', 'Bhutan', 'AFC', 'split', '#ffcc33', '#ff4e12'],
  ['SRI', 'Sri Lanka', 'AFC', 'speck', '#8d2029', '#ffbe29'],
  ['PAK', 'Pakistan', 'AFC', 'split', '#01411c', '#ffffff'],
  // OFC
  ['NZL', 'New Zealand', 'OFC', 'speck', '#111111', '#ffffff'],
  ['NCL', 'New Caledonia', 'OFC', 'band', '#009543', '#ed4135'],
  ['FIJ', 'Fiji', 'OFC', 'ring', '#68bfe5', '#ffffff'],
  ['SOL', 'Solomon Islands', 'OFC', 'split', '#0051ba', '#215b33'],
  ['TAH', 'Tahiti', 'OFC', 'band', '#ce1126', '#ffffff'],
  ['VAN', 'Vanuatu', 'OFC', 'band', '#009543', '#111111', '#d21034'],
];

export const TEAMS = {};
for (const [code, name, conf, pattern, ...colours] of RAW) {
  TEAMS[code] = { code, name, conf, pattern, colours };
}

export const CONFEDERATIONS = {
  UEFA: 'Europe', CONMEBOL: 'South America', CONCACAF: 'North & Central America',
  CAF: 'Africa', AFC: 'Asia', OFC: 'Oceania',
};

export function team(code) {
  return TEAMS[code] || { code, name: code, conf: '—', pattern: 'band', colours: ['#8892a4', '#ffffff'] };
}

export function teamsByConf(conf) {
  return Object.values(TEAMS).filter(t => t.conf === conf);
}
