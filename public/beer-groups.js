// Чотири групи пива і їхня привʼязка до чотирьох напрямків лабіринту.
// Спільне для /stage (проекція) і /maze (пульт).
//
// Poster не має поля «стиль», тому група визначається за назвою позиції.
// Порядок правил = пріоритет: спершу однозначні маркери (stout, gose, IPA),
// потім слабкі (кавові десерти, фруктові набори), решта падає в класику —
// саме так, як просив бар: «якщо не влазить нікуди, то в найближчу».

// Категорії, які грою ігноруються повністю: горішки, кухня, кава, посуд.
const BEER_NOT_BEER = /^(кава|кухня|стартери|посуд|пакування|закуски|горіхи|соуси|на хлібі|випічка|сир|м'ясо|напої|top screen|барні пріколи|back fox|silver spoon|d\.kit|d-kit family|sachi|underwood soft)/i;

// Напрямки: чотири ізометричні «сторони світу» ядра — ne ↗, se ↘, sw ↙, nw ↖.
const BEER_GROUPS = [
  {
    key: 'classic', dir: 'ne', arrow: '↗', name: 'КЛАСИКА', color: '#ffcf4a',
    hint: 'ЛАГЕР · ПШЕНИЧНЕ · PILSNER · BLANCHE',
  },
  {
    key: 'hoppy', dir: 'se', arrow: '↘', name: 'ОХМЕЛЕНЕ', color: '#8fd94a',
    hint: 'IPA · NEIPA · APA · PALE ALE',
  },
  {
    key: 'sour', dir: 'sw', arrow: '↙', name: 'САУЕР', color: '#e0559b',
    hint: 'SOUR · GOSE · BERLINER · FRUITED',
  },
  {
    key: 'dark', dir: 'nw', arrow: '↖', name: 'ТЕМНЕ', color: '#c98a4a',
    hint: 'STOUT · PORTER · BROWN · BARLEYWINE',
  },
];

const beerGroupByKey = k => BEER_GROUPS.find(g => g.key === k) || null;
const beerGroupByDir = d => BEER_GROUPS.find(g => g.dir === d) || null;

const BEER_RULES = [
  // 1. Однозначно темне
  ['dark', /stout|porter|портер|стаут|schwarz|brown ale|barleywine|barley wine|old ale|dubbel|quadrupel|\bdark\b|темн|doppelbock|\bbock\b/i],
  // 2. Однозначно сауер
  ['sour', /sour|gose|гозе|berliner|weisse|weiss(?!bier)|lambic|kriek|flanders|wild ale|gueuze|geuze|сауер|кисл|smoothie|shandy|kettle|solera/i],
  // 3. Однозначно охмелене
  ['hoppy', /\bipa\b|neipa|nedipa|aipa|\bdipa\b|\bipl\b|\bapa\b|\bxpa\b|pale ale|hazy|hoppy|\bddh\b|dry hop|session|cold ipa/i],
  // 4. Слабке темне: десертні стаути часто названі кавою чи шоколадом
  ['dark', /cappucc?ino|tiramisu|chocolate|шоколад|coffee|cocoa|cacao|espresso|mocha|nitro/i],
  // 5. Однозначна класика
  ['classic', /lager|лагер|лейджер|pilsner|\bpils\b|weizen|hefe|blanche|witbier|wheat|пшенич|k[oö]lsch|helles|amber|red ale|saison|bitter|\besb\b|belgian|tripel|golden ale|m[aä]rzen|altbier|cream ale|cider|сидр|mead|braggot|melomel|alco.?free|non.?alco|light/i],
  // 6. Слабкий сауер: набір фруктів у назві майже завжди означає fruited sour
  ['sour', /mango|cherry|raspberry|passion|pineapple|apricot|currant|peach|banana|coconut|yuzu|lime|strawberry|blackberry|blueberry|bilberry|plum|fruit|berry|ягід|вишн|малин/i],
];

// Абревіатури стилів пишуться тільки капслоком: IS = Imperial Stout,
// IMS = Imperial Milk Stout. Без урахування регістру сюди б падало англійське
// «is» з будь-якої назви, тож ця перевірка окрема й чутлива до регістру.
const BEER_ABBR_DARK = /\b(IS|IMS|BA IS|RIS)\b/;

// Повертає обʼєкт групи або null, якщо це взагалі не пиво (горішки, кава, посуд).
function beerGroupFor(name, category) {
  if (!name) return null;
  if (BEER_NOT_BEER.test(String(category || ''))) return null;
  if (BEER_ABBR_DARK.test(name)) return beerGroupByKey('dark');
  for (const [key, re] of BEER_RULES) if (re.test(name)) return beerGroupByKey(key);
  return beerGroupByKey('classic');   // найближча за замовчуванням
}

// Кольори стрілок на полі мають збігатися з кольорами груп у легенді.
// MAZE_DIR_COLORS оголошено в maze-core.js; підміняємо чотири базові ключі.
function beerApplyDirColors() {
  if (typeof MAZE_DIR_COLORS === 'undefined') return;
  BEER_GROUPS.forEach(g => { MAZE_DIR_COLORS[g.dir] = g.color; });
}
