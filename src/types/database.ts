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
          category_id: string | null;
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
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export type Category = Database['public']['Tables']['categories']['Row'];
export type Intent = Database['public']['Tables']['intents']['Row'];
export type IntentInsert = Database['public']['Tables']['intents']['Insert'];
export type IntentUpdate = Database['public']['Tables']['intents']['Update'];
export type CategoryInsert = Database['public']['Tables']['categories']['Insert'];

export interface IntentWithCategory extends Intent {
  categories: Category | null;
}
