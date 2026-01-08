import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://heagxebvbirbhhedghng.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_PqWZ7Yp8GWwz8chnGuOVPg_XXr9H7Nu";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
