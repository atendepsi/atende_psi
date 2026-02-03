import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://apbisumgrssgwbbnnnhk.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwYmlzdW1ncnNzZ3diYm5ubmhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3MDU0MTQsImV4cCI6MjA4NTI4MTQxNH0.H0e3XgdYdY2w_l7sJ91J6V3nPGGVTEi4tgwMQqhQwPw";

export const supabase = createClient(supabaseUrl, supabaseKey);
