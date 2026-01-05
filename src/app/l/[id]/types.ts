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
    asiatiskt: { id: "asiatiskt", title: "All världens mat", itemIds: [] },
    skafferi: { id: "skafferi", title: "Skafferi", itemIds: [] },
    snacks: { id: "snacks", title: "Snacks", itemIds: [] },
    dryck: { id: "dryck", title: "Dryck", itemIds: [] },
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
    "skafferi",
    "snacks",
    "dryck",
    "stadvaror",
    "barn",
    "hygien",
    "frys_bar_glass",
    "ovrigt",
  ],
};
