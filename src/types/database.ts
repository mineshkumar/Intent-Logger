export interface Database {
  public: {
    Tables: {
      categories: {
        Row: {
          id: string;
          name: string;
          color: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          color?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          color?: string;
          created_at?: string;
        };
        Relationships: [];
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
          category_id?: string | null;
          duration_minutes?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          category_id?: string | null;
          duration_minutes?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'intents_category_id_fkey';
            columns: ['category_id'];
            referencedRelation: 'categories';
            referencedColumns: ['id'];
          }
        ];
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


export type Category = Database['public']['Tables']['categories']['Row'];
export type Intent = Database['public']['Tables']['intents']['Row'];

export interface IntentWithCategory extends Intent {
  categories: Category[];
}

export type IntentInsert = Omit<Intent, 'id' | 'created_at' | 'updated_at'> & {
  category_ids?: string[];
};

export type IntentUpdate = Partial<IntentInsert>;
export type CategoryInsert = Database['public']['Tables']['categories']['Insert'];
