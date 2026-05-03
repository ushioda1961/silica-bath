export type Store = {
  id: string;
  store_id: string;
  name: string;
  password: string;
  max_samples: number;
  is_admin: boolean;
  display_order: number;
  created_at: string;
};

export type Customer = {
  id: string;
  store_id: string;
  name: string;
  gender: string | null;
  age_group: string | null;
  age: number | null;
  contracted: boolean;
  contracted_at: string | null;
  distributed_at: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type SessionPayload = {
  storeUuid: string;
  storeId: string;
  storeName: string;
  isAdmin: boolean;
};

export const GENDER_OPTIONS = ["女性", "男性", "その他"] as const;
export const AGE_GROUP_OPTIONS = [
  "10代",
  "20代",
  "30代",
  "40代",
  "50代",
  "60代",
  "70代",
  "80代以上",
] as const;
