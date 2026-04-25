export type PlanId = 'free' | 'premium' | 'lifetime';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  plan_id: PlanId;
  created_at: string;
  updated_at: string;
}

export interface Pet {
  id: string;
  owner_id: string;
  name: string;
  species: string;
  breed: string | null;
  birth_date: string | null;
  death_date: string | null;
  avatar_url: string | null;
  memorial_slug: string;
  is_public: boolean;
  tribute_text: string | null;
  created_at: string;
  updated_at: string;
}

export interface TimelineEntry {
  id: string;
  pet_id: string;
  title: string;
  description: string | null;
  date: string;
  photo_urls: string[];
  created_at: string;
}

export interface Tribute {
  id: string;
  pet_id: string;
  author_name: string;
  author_relation: string | null;
  message: string;
  created_at: string;
}

export interface TimeCapsule {
  id: string;
  pet_id: string;
  title: string;
  message: string;
  open_at: string;
  opened: boolean;
  created_at: string;
}

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Profile, 'id' | 'created_at' | 'updated_at'>>;
      };
      pets: {
        Row: Pet;
        Insert: Omit<Pet, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Pet, 'id' | 'owner_id' | 'created_at' | 'updated_at'>>;
      };
      timeline_entries: {
        Row: TimelineEntry;
        Insert: Omit<TimelineEntry, 'id' | 'created_at'>;
        Update: Partial<Omit<TimelineEntry, 'id' | 'pet_id' | 'created_at'>>;
      };
      time_capsules: {
        Row: TimeCapsule;
        Insert: Omit<TimeCapsule, 'id' | 'opened' | 'created_at'> & { title: string };
        Update: Partial<Pick<TimeCapsule, 'opened'>>;
      };
    };
  };
};
