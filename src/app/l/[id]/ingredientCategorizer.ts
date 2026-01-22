import { BoardState, StoreKey, getDefaultBoardForStore } from "./types";
import rulesJson from "./ingredientRules.json";

type ColumnId = string;

function columnExists(board: BoardState, columnId: ColumnId) {
  return Boolean(board.columns[columnId]);
}

function resolveColumnId(_store: StoreKey, board: BoardState, suggested: ColumnId): ColumnId {
  if (columnExists(board, suggested)) return suggested;
  return "ovrigt";
}

// --- Normalisering ---
const UNIT_WORDS = [
  "g","kg","hg","mg","dl","cl","l","ml","msk","tsk","krm",
  "st","styck","förp","pkt","burk","burkar","klyfta","klyftor","blad"
];

const STOPWORDS = [
  "att","till","i","ca","cirka","gärna","valfritt","finhackad","hackad","skivad","riven",
  "nymalen","nystött","att steka i","till stekning","att garnera med"
];

function normalizeIngredient(line: string): string {
  let s = line.trim().toLowerCase();

  // ta bort parenteser
  s = s.replace(/\([^)]*\)/g, " ");

  // ofta är allt efter komma bara kommentar: "smör, att steka i"
  s = s.split(",")[0].trim();

  // ersätt specialbråk (½ etc) och ta bort ledande mängd
  s = s
    .replace(/½/g, " 1/2 ")
    .replace(/¼/g, " 1/4 ")
    .replace(/¾/g, " 3/4 ");

  // ta bort ledande mängd: "800 g", "3 dl", "1/2 tsk"
  s = s.replace(/^(\d+([.,]\d+)?|\d+\/\d+)\s*/g, "");

  // ta bort enheter om de står först
  const unitRegex = new RegExp(`^(${UNIT_WORDS.join("|")})\\b\\s*`, "i");
  s = s.replace(unitRegex, "");

  // ta bort varumärkes-/®-grejer
  s = s.replace(/®|™/g, "");

  // städa upp extra mellanslag
  s = s.replace(/\s+/g, " ").trim();

  // ta bort vissa trailing-fraser
  for (const w of STOPWORDS) {
    s = s.replace(new RegExp(`\\b${escapeRegExp(w)}\\b`, "g"), "").trim();
  }

  // städa igen
  s = s.replace(/\s+/g, " ").trim();
  return s;
}

function escapeRegExp(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// --- Regler (ordning är viktig: specifikt först) ---
type Rule = {
  columnId: ColumnId;
  keywords?: string[];
  regex?: RegExp;
};

const RULES: Rule[] = [
  ...rulesJson,
  // fallback
  { columnId: "ovrigt", regex: /.*/ },
];

export function suggestColumnForIngredient(
  rawLine: string,
  store: StoreKey,
  board: BoardState = getDefaultBoardForStore(store)
): { columnId: ColumnId; normalized: string } {
  const normalized = normalizeIngredient(rawLine);

  for (const rule of RULES) {
    const hit =
      (rule.keywords?.some(k => normalized.includes(k)) ?? false) ||
      (rule.regex ? rule.regex.test(normalized) : false);

    if (hit) {
      const resolved = resolveColumnId(store, board, rule.columnId);
      return { columnId: resolved, normalized };
    }
  }

  return { columnId: "ovrigt", normalized };
}
