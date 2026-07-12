import os
from supabase import create_client, Client

# Retrieve environment variables injected by the environment
supabase_url: str = os.environ.get("SUPABASE_URL")
supabase_key: str = os.environ.get("SUPABASE_SERVICE_KEY")

if not supabase_url or not supabase_key:
    raise ValueError("Missing Supabase environment variables in runtime context.")

# Initialize the administrative client
supabase: Client = create_client(supabase_url, supabase_key)
