export type Database = {
  public: {
    Tables: {
      grocery_lists: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      list_columns: {
        Row: {
          id: string;
          list_id: string;
          title: string;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id: string;
          list_id: string;
          title: string;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          list_id?: string;
          title?: string;
          sort_order?: number;
          created_at?: string;
        };
      };
      list_items: {
        Row: {
          id: string;
          list_id: string;
          column_id: string;
          text: string;
          checked: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          list_id: string;
          column_id: string;
          text: string;
          checked?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          list_id?: string;
          column_id?: string;
          text?: string;
          checked?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      recipes: {
        Row: {
          id: string;
          list_id: string;
          title: string;
          url: string;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          list_id: string;
          title: string;
          url: string;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          list_id?: string;
          title?: string;
          url?: string;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
};

export type GroceryList = Database["public"]["Tables"]["grocery_lists"]["Row"];
export type ListColumn = Database["public"]["Tables"]["list_columns"]["Row"];
export type ListItem = Database["public"]["Tables"]["list_items"]["Row"];
export type Recipe = Database["public"]["Tables"]["recipes"]["Row"];
