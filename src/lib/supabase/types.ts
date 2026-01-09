export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      grocery_lists: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          store: string | null;
        };
        Insert: {
          id: string;
          created_at?: string;
          updated_at?: string;
          store?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          store?: string | null;
        };
        Relationships: [];
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
        Relationships: [];
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
        Relationships: [];
      };
      recipes: {
        Row: {
          id: string;
          list_id: string;
          title: string | null;
          url: string;
          sort_order: number;
          created_at: string;
          updated_at: string;

          ingredients: string[] | null;
          instructions: string | null;
          yields: string | null;
          total_time: number | null;
          image_url: string | null;
          host: string | null;
        };
        Insert: {
          id: string;
          list_id: string;
          title?: string | null;
          url: string;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;

          ingredients?: string[] | null;
          instructions?: string | null;
          yields?: string | null;
          total_time?: number | null;
          image_url?: string | null;
          host?: string | null;
        };
        Update: {
          id?: string;
          list_id?: string;
          title?: string | null;
          url?: string;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;

          ingredients?: string[] | null;
          instructions?: string | null;
          yields?: string | null;
          total_time?: number | null;
          image_url?: string | null;
          host?: string | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      delete_old_lists: {
        Args: Record<string, never>;
        Returns: number;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type GroceryList = Database["public"]["Tables"]["grocery_lists"]["Row"];
export type ListColumn = Database["public"]["Tables"]["list_columns"]["Row"];
export type ListItem = Database["public"]["Tables"]["list_items"]["Row"];
export type Recipe = Database["public"]["Tables"]["recipes"]["Row"];
