import requests
import pandas as pd
import json
from collections import Counter

def analyze_production_logs():
    """Analyze the latest production logs to identify issues and successes"""
    
    # Fetch the CSV data
    url = "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logs_result%20%283%29-HaOCYjIsMbtCqHsfYRDTjbENoqYtKs.csv"
    
    try:
        response = requests.get(url)
        response.raise_for_status()
        
        # Save to temporary file and read with pandas
        with open('/tmp/logs.csv', 'w') as f:
            f.write(response.text)
        
        df = pd.read_csv('/tmp/logs.csv')
        
        print("=== PRODUCTION LOG ANALYSIS ===")
        print(f"Total log entries: {len(df)}")
        print()
        
        # Analyze status codes
        print("=== STATUS CODE DISTRIBUTION ===")
        status_counts = df['responseStatusCode'].value_counts()
        for status, count in status_counts.items():
            print(f"Status {status}: {count} requests")
        print()
        
        # Analyze request paths
        print("=== TOP REQUEST PATHS ===")
        path_counts = df['requestPath'].value_counts().head(10)
        for path, count in path_counts.items():
            print(f"{path}: {count} requests")
        print()
        
        # Analyze messages for errors and successes
        print("=== MESSAGE ANALYSIS ===")
        messages = df['message'].dropna()
        
        # Count different types of messages
        success_messages = messages[messages.str.contains('success', case=False, na=False)]
        error_messages = messages[messages.str.contains('error', case=False, na=False)]
        supabase_messages = messages[messages.str.contains('supabase', case=False, na=False)]
        
        print(f"Success messages: {len(success_messages)}")
        print(f"Error messages: {len(error_messages)}")
        print(f"Supabase messages: {len(supabase_messages)}")
        print()
        
        # Show unique messages
        print("=== UNIQUE MESSAGES ===")
        unique_messages = messages.unique()
        for msg in unique_messages[:20]:  # Show first 20
            if pd.notna(msg):
                print(f"- {msg}")
        
        # Analyze by environment
        print("\n=== ENVIRONMENT ANALYSIS ===")
        env_counts = df['environment'].value_counts()
        for env, count in env_counts.items():
            print(f"{env}: {count} requests")
        
        # Analyze user agents
        print("\n=== USER AGENT ANALYSIS ===")
        ua_counts = df['requestUserAgent'].value_counts().head(5)
        for ua, count in ua_counts.items():
            print(f"{ua}: {count} requests")
        
        print("\n=== ANALYSIS COMPLETE ===")
        
    except Exception as e:
        print(f"Error analyzing logs: {e}")

if __name__ == "__main__":
    analyze_production_logs()
