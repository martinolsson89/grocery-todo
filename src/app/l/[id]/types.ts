export type Item = {
  id: string;
  text: string;
  checked: boolean;
};

export type Section = {
  id: string;
  title: string;
  itemIds: string[];
};

export type BoardState = {
  items: Record<string, Item>;
  columns: Record<string, Section>;
  columnOrder: string[];
};

export type StoreKey = "willys" | "hemkop";
export type StoreTemplateId = "willys_default" | "hemkop_default";

export const DEFAULT_STORE: StoreKey = "willys";
export const STORE_LABEL: Record<StoreKey, string> = {
  willys: "Willys",
  hemkop: "Hemköp",
};
export const STORE_TEMPLATE_BY_STORE: Record<StoreKey, StoreTemplateId> = {
  willys: "willys_default",
  hemkop: "hemkop_default",
};

export function coerceStoreKey(value: string | null | undefined): StoreKey {
  return value === "hemkop" ? "hemkop" : "willys";
}

export function getStoreTemplateId(store: StoreKey): StoreTemplateId {
  return STORE_TEMPLATE_BY_STORE[store];
}

export const DEFAULT_BOARD: BoardState = {
  items: {},
  columns: {
    frukt_gront: { id: "frukt_gront", title: "Frukt & Grönt", itemIds: [] },
    brod: { id: "brod", title: "Bröd", itemIds: [] },
    fika: {id: "fika", title: "Fika", itemIds: []},
    chark: { id: "chark", title: "Chark", itemIds: [] },
    ost_palagg: { id: "ost_palagg", title: "Ost/skinka/pålägg", itemIds: [] },
    protein: { id: "protein", title: "Protein (Färskt)", itemIds: [] },
    mejeri: { id: "mejeri", title: "Mejeri", itemIds: [] },
    frysvaror: { id: "frysvaror", title: "Frysvaror", itemIds: [] },
    asiatiskt: { id: "asiatiskt", title: "Asiatiskt", itemIds: [] },
    tacohyllan: { id: "tacohyllan", title: "Tacohyllan", itemIds: [] },
    skafferi: { id: "skafferi", title: "Skafferi", itemIds: [] },
    dryck: { id: "dryck", title: "Dryck", itemIds: [] },
    snacks: { id: "snacks", title: "Snacks", itemIds: [] },
    stadvaror: { id: "stadvaror", title: "Städvaror", itemIds: [] },
    barn: { id: "barn", title: "Barn", itemIds: [] },
    hygien: { id: "hygien", title: "Hygien", itemIds: [] },
    frys_bar_glass: { id: "frys_bar_glass", title: "Frys (bär/glass)", itemIds: [] },
    ovrigt: { id: "ovrigt", title: "Övrigt", itemIds: [] },
  },
  columnOrder: [
    "frukt_gront",
    "brod",
    "fika",
    "chark",
    "ost_palagg",
    "protein",
    "mejeri",
    "frysvaror",
    "asiatiskt",
    "tacohyllan",
    "skafferi",
    "dryck",
    "snacks",
    "stadvaror",
    "barn",
    "hygien",
    "frys_bar_glass",
    "ovrigt",
  ],
};

export const HEMKOP_BOARD: BoardState = {
  items: {},
  columns: {
    frukt_gront: { id: "frukt_gront", title: "Frukt & Grönt", itemIds: [] },
    brod: { id: "brod", title: "Bröd", itemIds: [] },
    fika: { id: "fika", title: "Fika", itemIds: [] },
    chark: { id: "chark", title: "Chark", itemIds: [] },
    ost_palagg: { id: "ost_palagg", title: "Ost/skinka/pålägg", itemIds: [] },
    protein: { id: "protein", title: "Protein (Färskt)", itemIds: [] },
    tacohyllan: { id: "tacohyllan", title: "Tacohyllan", itemIds: [] },
    frysvaror: { id: "frysvaror", title: "Frysvaror", itemIds: [] },
    mejeri: { id: "mejeri", title: "Mejeri", itemIds: [] },
    dryck: { id: "dryck", title: "Dryck", itemIds: [] },
    snacks: { id: "snacks", title: "Snacks", itemIds: [] },
    skafferi: { id: "skafferi", title: "Skafferi", itemIds: [] },
    asiatiskt: { id: "asiatiskt", title: "Asiatiskt", itemIds: [] },
    frys_bar_glass: { id: "frys_bar_glass", title: "Frys (bär/glass)", itemIds: [] },
    barn: { id: "barn", title: "Barn", itemIds: [] },
    hygien: { id: "hygien", title: "Hygien", itemIds: [] },
    stadvaror: { id: "stadvaror", title: "Städvaror", itemIds: [] },
    ovrigt: { id: "ovrigt", title: "Övrigt", itemIds: [] },
  },
  columnOrder: [
    "frukt_gront",
    "brod",
    "fika",
    "chark",
    "ost_palagg",
    "protein",
    "tacohyllan",
    "frysvaror",
    "mejeri",
    "dryck",
    "snacks",
    "skafferi",
    "asiatiskt",
    "frys_bar_glass",
    "barn",
    "hygien",
    "stadvaror",
    "ovrigt",
  ],
};

export function getDefaultBoardForStore(store: StoreKey): BoardState {
  return store === "hemkop" ? HEMKOP_BOARD : DEFAULT_BOARD;
}

