import { withProtectedCode } from "../util/protect-code.js";

const ENTITY_RE = /&(?:#(\d{1,6})|#x([0-9a-fA-F]{1,6})|([a-zA-Z][a-zA-Z0-9]{1,31}));/g;

const NAMED_ENTITIES: ReadonlyMap<string, string> = new Map([
  ["amp", "&"], ["lt", "<"], ["gt", ">"], ["quot", '"'], ["apos", "'"],
  ["nbsp", " "], ["ensp", " "], ["emsp", " "], ["thinsp", " "],
  ["ndash", "–"], ["mdash", "—"], ["horbar", "―"],
  ["lsquo", "‘"], ["rsquo", "’"], ["sbquo", "‚"],
  ["ldquo", "“"], ["rdquo", "”"], ["bdquo", "„"],
  ["laquo", "«"], ["raquo", "»"],
  ["hellip", "…"], ["middot", "·"], ["bull", "•"],
  ["copy", "©"], ["reg", "®"], ["trade", "™"],
  ["euro", "€"], ["pound", "£"], ["yen", "¥"], ["cent", "¢"],
  ["times", "×"], ["divide", "÷"], ["plusmn", "±"],
  ["frac12", "½"], ["frac14", "¼"], ["frac34", "¾"],
  ["sup1", "¹"], ["sup2", "²"], ["sup3", "³"],
  ["deg", "°"], ["micro", "µ"], ["para", "¶"],
  ["sect", "§"], ["dagger", "†"], ["Dagger", "‡"],
  ["prime", "′"], ["Prime", "″"],
  ["larr", "←"], ["rarr", "→"], ["uarr", "↑"], ["darr", "↓"],
  ["harr", "↔"], ["lArr", "⇐"], ["rArr", "⇒"],
  ["forall", "∀"], ["exist", "∃"], ["empty", "∅"],
  ["isin", "∈"], ["notin", "∉"], ["ni", "∋"],
  ["sum", "∑"], ["prod", "∏"], ["infin", "∞"],
  ["and", "∧"], ["or", "∨"], ["cap", "∩"], ["cup", "∪"],
  ["int", "∫"], ["there4", "∴"], ["sim", "∼"],
  ["cong", "≅"], ["asymp", "≈"], ["ne", "≠"],
  ["le", "≤"], ["ge", "≥"],
  ["sub", "⊂"], ["sup", "⊃"], ["sube", "⊆"], ["supe", "⊇"],
  ["oplus", "⊕"], ["otimes", "⊗"], ["perp", "⊥"],
  ["sdot", "⋅"], ["lceil", "⌈"], ["rceil", "⌉"],
  ["lfloor", "⌊"], ["rfloor", "⌋"],
  ["lang", "〈"], ["rang", "〉"],
  ["loz", "◊"], ["spades", "♠"], ["clubs", "♣"],
  ["hearts", "♥"], ["diams", "♦"],
  ["Alpha", "Α"], ["Beta", "Β"], ["Gamma", "Γ"], ["Delta", "Δ"],
  ["alpha", "α"], ["beta", "β"], ["gamma", "γ"], ["delta", "δ"],
  ["epsilon", "ε"], ["zeta", "ζ"], ["eta", "η"], ["theta", "θ"],
  ["iota", "ι"], ["kappa", "κ"], ["lambda", "λ"], ["mu", "μ"],
  ["nu", "ν"], ["xi", "ξ"], ["omicron", "ο"], ["pi", "π"],
  ["rho", "ρ"], ["sigma", "σ"], ["tau", "τ"], ["upsilon", "υ"],
  ["phi", "φ"], ["chi", "χ"], ["psi", "ψ"], ["omega", "ω"],
  ["szlig", "ß"], ["Agrave", "À"], ["Aacute", "Á"],
  ["Atilde", "Ã"], ["Auml", "Ä"], ["Aring", "Å"],
  ["AElig", "Æ"], ["Ccedil", "Ç"], ["Egrave", "È"],
  ["Eacute", "É"], ["Ecirc", "Ê"], ["Euml", "Ë"],
  ["Igrave", "Ì"], ["Iacute", "Í"], ["Ntilde", "Ñ"],
  ["Ograve", "Ò"], ["Oacute", "Ó"], ["Otilde", "Õ"],
  ["Ouml", "Ö"], ["Oslash", "Ø"], ["Ugrave", "Ù"],
  ["Uacute", "Ú"], ["Uuml", "Ü"], ["Yacute", "Ý"],
  ["agrave", "à"], ["aacute", "á"], ["acirc", "â"],
  ["atilde", "ã"], ["auml", "ä"], ["aring", "å"],
  ["aelig", "æ"], ["ccedil", "ç"], ["egrave", "è"],
  ["eacute", "é"], ["ecirc", "ê"], ["euml", "ë"],
  ["igrave", "ì"], ["iacute", "í"], ["icirc", "î"], ["iuml", "ï"],
  ["eth", "ð"], ["ntilde", "ñ"], ["ograve", "ò"], ["oacute", "ó"],
  ["ocirc", "ô"], ["otilde", "õ"], ["ouml", "ö"], ["oslash", "ø"],
  ["ugrave", "ù"], ["uacute", "ú"], ["ucirc", "û"], ["uuml", "ü"],
  ["yacute", "ý"], ["thorn", "þ"], ["yuml", "ÿ"],
]);

export function decodeHtmlEntities(md: string): string {
  return withProtectedCode(md, (s) =>
    s.replace(ENTITY_RE, (_full, dec, hex, name) => {
      if (dec !== undefined) {
        const cp = parseInt(dec, 10);
        return cp > 0 && cp <= 0x10ffff ? String.fromCodePoint(cp) : _full;
      }
      if (hex !== undefined) {
        const cp = parseInt(hex, 16);
        return cp > 0 && cp <= 0x10ffff ? String.fromCodePoint(cp) : _full;
      }
      return NAMED_ENTITIES.get(name ?? "") ?? _full;
    }),
  );
}
