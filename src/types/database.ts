export interface Database {
  public: {
    Tables: {
      tag_categories: {
        Row: {
          id: string;
          name: string;
          icon: string | null;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          icon?: string | null;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          icon?: string | null;
          sort_order?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      categories: {
        Row: {
          id: string;
          name: string;
          color: string;
          tag_category_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          color?: string;
          tag_category_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          color?: string;
          tag_category_id?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'categories_tag_category_id_fkey';
            columns: ['tag_category_id'];
            referencedRelation: 'tag_categories';
            referencedColumns: ['id'];
          }
        ];
      };
      intents: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          duration_minutes: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          duration_minutes?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          duration_minutes?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      intent_tags: {
        Row: {
          intent_id: string;
          category_id: string;
        };
        Insert: {
          intent_id: string;
          category_id: string;
        };
        Update: {
          intent_id?: string;
          category_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'intent_tags_category_id_fkey';
            columns: ['category_id'];
            referencedRelation: 'categories';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'intent_tags_intent_id_fkey';
            columns: ['intent_id'];
            referencedRelation: 'intents';
            referencedColumns: ['id'];
          }
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

// Tag category (group of tags like "Mood", "Time", "Place")
export type TagCategory = Database['public']['Tables']['tag_categories']['Row'];
export type TagCategoryInsert = Database['public']['Tables']['tag_categories']['Insert'];

// Tag (individual tag like "Happy", "Morning", "Home")
export type Tag = Database['public']['Tables']['categories']['Row'];
export type TagInsert = Database['public']['Tables']['categories']['Insert'];

// Legacy alias for backwards compatibility
export type Category = Tag;
export type CategoryInsert = TagInsert;

// Tag with its category info
export interface TagWithCategory extends Tag {
  tag_category: TagCategory | null;
}

// Intent
export type Intent = Database['public']['Tables']['intents']['Row'];

export interface IntentWithTags extends Intent {
  tags?: TagWithCategory[];
  categories: TagWithCategory[]; // Legacy property name used in current code
}

// Legacy alias
export type IntentWithCategory = IntentWithTags;

export type IntentInsert = Omit<Database['public']['Tables']['intents']['Insert'], 'category_id'> & {
  tag_ids?: string[];
  category_ids?: string[]; // Legacy alias for tag_ids
};

export type IntentUpdate = Partial<IntentInsert>;
