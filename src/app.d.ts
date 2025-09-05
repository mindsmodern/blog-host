// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
export {};

import type { Session, SupabaseClient, User } from '@supabase/supabase-js';
import type { Database } from './lib/util'; // import generated types

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			domain: string;
			supabase: SupabaseClient<Database>;
			safeGetSession: () => Promise<{ session: Session | null; user: User | null }>;
			session: Session | null;
			user: User | null;
		}
		interface PageData {
			session: Session | null;
		}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
