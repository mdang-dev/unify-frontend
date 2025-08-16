import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);


const storageUrl = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_URL
const storageAnonKey = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_ANON_KEY
export const supabaseStorage = createClient(storageUrl, storageAnonKey)

// Storage bucket name
export const STORAGE_BUCKET = 'media' 