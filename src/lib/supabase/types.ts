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
          store_template_id: string;
        };
        Insert: {
          id: string;
          created_at?: string;
          updated_at?: string;
          store_template_id: string;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          store_template_id?: string;
        };
        Relationships: [];
      };
      categories: {
        Row: {
          id: string;
          title: string;
          created_at: string;
        };
        Insert: {
          id: string;
          title: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      list_items: {
        Row: {
          id: string;
          list_id: string;
          category_id: string;
          text: string;
          checked: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          list_id: string;
          category_id: string;
          text: string;
          checked?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          list_id?: string;
          category_id?: string;
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
      store_template_category_order: {
        Row: {
          template_id: string;
          category_id: string;
          sort_order: number;
        };
        Insert: {
          template_id: string;
          category_id: string;
          sort_order: number;
        };
        Update: {
          template_id?: string;
          category_id?: string;
          sort_order?: number;
        };
        Relationships: [];
      };
      store_templates: {
        Row: {
          id: string;
          store_id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id: string;
          store_id: string;
          name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          store_id?: string;
          name?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      stores: {
        Row: {
          id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id: string;
          name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          created_at?: string;
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
      get_list_render: {
        Args: {
          list_id: string;
        };
        Returns: Json;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type GroceryList = Database["public"]["Tables"]["grocery_lists"]["Row"];
export type Category = Database["public"]["Tables"]["categories"]["Row"];
export type ListItem = Database["public"]["Tables"]["list_items"]["Row"];
export type Recipe = Database["public"]["Tables"]["recipes"]["Row"];
export type StoreTemplateCategoryOrder =
  Database["public"]["Tables"]["store_template_category_order"]["Row"];
