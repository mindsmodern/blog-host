export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
	graphql_public: {
		Tables: {
			[_ in never]: never;
		};
		Views: {
			[_ in never]: never;
		};
		Functions: {
			graphql: {
				Args: {
					extensions?: Json;
					operationName?: string;
					query?: string;
					variables?: Json;
				};
				Returns: Json;
			};
		};
		Enums: {
			[_ in never]: never;
		};
		CompositeTypes: {
			[_ in never]: never;
		};
	};
	public: {
		Tables: {
			documents: {
				Row: {
					content: Json;
					created_at: string;
					id: string;
					post_id: string;
					tag: string | null;
					updated_at: string;
					width: number | null;
				};
				Insert: {
					content: Json;
					created_at?: string;
					id?: string;
					post_id: string;
					tag?: string | null;
					updated_at?: string;
					width?: number | null;
				};
				Update: {
					content?: Json;
					created_at?: string;
					id?: string;
					post_id?: string;
					tag?: string | null;
					updated_at?: string;
					width?: number | null;
				};
				Relationships: [
					{
						foreignKeyName: 'documents_post_id_fkey';
						columns: ['post_id'];
						isOneToOne: false;
						referencedRelation: 'posts';
						referencedColumns: ['id'];
					}
				];
			};
			domains: {
				Row: {
					created_at: string;
					description: string | null;
					domain_name: string;
					favicon_url: string | null;
					id: string;
					owner_id: string;
					title: string | null;
					updated_at: string;
				};
				Insert: {
					created_at?: string;
					description?: string | null;
					domain_name: string;
					favicon_url?: string | null;
					id?: string;
					owner_id: string;
					title?: string | null;
					updated_at?: string;
				};
				Update: {
					created_at?: string;
					description?: string | null;
					domain_name?: string;
					favicon_url?: string | null;
					id?: string;
					owner_id?: string;
					title?: string | null;
					updated_at?: string;
				};
				Relationships: [];
			};
			post_redirects: {
				Row: {
					created_at: string;
					domain_id: string;
					id: string;
					old_slug: string;
					post_id: string;
				};
				Insert: {
					created_at?: string;
					domain_id: string;
					id?: string;
					old_slug: string;
					post_id: string;
				};
				Update: {
					created_at?: string;
					domain_id?: string;
					id?: string;
					old_slug?: string;
					post_id?: string;
				};
				Relationships: [
					{
						foreignKeyName: 'post_redirects_domain_id_fkey';
						columns: ['domain_id'];
						isOneToOne: false;
						referencedRelation: 'domains';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'post_redirects_post_id_fkey';
						columns: ['post_id'];
						isOneToOne: false;
						referencedRelation: 'posts';
						referencedColumns: ['id'];
					}
				];
			};
			posts: {
				Row: {
					created_at: string;
					domain_id: string;
					id: string;
					meta_description: string | null;
					slug: string | null;
					theme_id: string | null;
					title: string;
					updated_at: string;
				};
				Insert: {
					created_at?: string;
					domain_id: string;
					id?: string;
					meta_description?: string | null;
					slug?: string | null;
					theme_id?: string | null;
					title: string;
					updated_at?: string;
				};
				Update: {
					created_at?: string;
					domain_id?: string;
					id?: string;
					meta_description?: string | null;
					slug?: string | null;
					theme_id?: string | null;
					title?: string;
					updated_at?: string;
				};
				Relationships: [
					{
						foreignKeyName: 'posts_domain_id_fkey';
						columns: ['domain_id'];
						isOneToOne: false;
						referencedRelation: 'domains';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'posts_theme_id_fkey';
						columns: ['theme_id'];
						isOneToOne: false;
						referencedRelation: 'themes';
						referencedColumns: ['id'];
					}
				];
			};
			themes: {
				Row: {
					config: Json;
					created_at: string;
					created_by: string;
					description: string | null;
					id: string;
					name: string;
					updated_at: string;
				};
				Insert: {
					config?: Json;
					created_at?: string;
					created_by: string;
					description?: string | null;
					id?: string;
					name: string;
					updated_at?: string;
				};
				Update: {
					config?: Json;
					created_at?: string;
					created_by?: string;
					description?: string | null;
					id?: string;
					name?: string;
					updated_at?: string;
				};
				Relationships: [];
			};
		};
		Views: {
			[_ in never]: never;
		};
		Functions: {
			citext: {
				Args: { '': boolean } | { '': string } | { '': unknown };
				Returns: string;
			};
			citext_hash: {
				Args: { '': string };
				Returns: number;
			};
			citextin: {
				Args: { '': unknown };
				Returns: string;
			};
			citextout: {
				Args: { '': string };
				Returns: unknown;
			};
			citextrecv: {
				Args: { '': unknown };
				Returns: string;
			};
			citextsend: {
				Args: { '': string };
				Returns: string;
			};
		};
		Enums: {
			[_ in never]: never;
		};
		CompositeTypes: {
			[_ in never]: never;
		};
	};
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>];

export type Tables<
	DefaultSchemaTableNameOrOptions extends
		| keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
		| { schema: keyof DatabaseWithoutInternals },
	TableName extends DefaultSchemaTableNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals;
	}
		? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
				DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
		: never = never
> = DefaultSchemaTableNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals;
}
	? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
			DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
			Row: infer R;
		}
		? R
		: never
	: DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
		? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
				Row: infer R;
			}
			? R
			: never
		: never;

export type TablesInsert<
	DefaultSchemaTableNameOrOptions extends
		| keyof DefaultSchema['Tables']
		| { schema: keyof DatabaseWithoutInternals },
	TableName extends DefaultSchemaTableNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals;
	}
		? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
		: never = never
> = DefaultSchemaTableNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals;
}
	? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
			Insert: infer I;
		}
		? I
		: never
	: DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
		? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
				Insert: infer I;
			}
			? I
			: never
		: never;

export type TablesUpdate<
	DefaultSchemaTableNameOrOptions extends
		| keyof DefaultSchema['Tables']
		| { schema: keyof DatabaseWithoutInternals },
	TableName extends DefaultSchemaTableNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals;
	}
		? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
		: never = never
> = DefaultSchemaTableNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals;
}
	? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
			Update: infer U;
		}
		? U
		: never
	: DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
		? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
				Update: infer U;
			}
			? U
			: never
		: never;

export type Enums<
	DefaultSchemaEnumNameOrOptions extends
		| keyof DefaultSchema['Enums']
		| { schema: keyof DatabaseWithoutInternals },
	EnumName extends DefaultSchemaEnumNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals;
	}
		? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
		: never = never
> = DefaultSchemaEnumNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals;
}
	? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
	: DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
		? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
		: never;

export type CompositeTypes<
	PublicCompositeTypeNameOrOptions extends
		| keyof DefaultSchema['CompositeTypes']
		| { schema: keyof DatabaseWithoutInternals },
	CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals;
	}
		? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
		: never = never
> = PublicCompositeTypeNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals;
}
	? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
	: PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
		? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
		: never;

export const Constants = {
	graphql_public: {
		Enums: {}
	},
	public: {
		Enums: {}
	}
} as const;
