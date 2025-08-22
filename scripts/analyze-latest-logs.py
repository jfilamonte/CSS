import requests
import pandas as pd
import json
from collections import Counter

def analyze_production_logs():
    """Analyze the latest production logs to identify issues and patterns"""
    
    # Fetch the CSV data
    url = "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logs_result%20%284%29-EHEmw7hPHHWnC0tBF13q96IjNvBwaY.csv"
    
    try:
        print("[v0] Fetching production logs...")
        response = requests.get(url)
        response.raise_for_status()
        
        # Save to temporary file and read with pandas
        with open('/tmp/logs.csv', 'w') as f:
            f.write(response.text)
        
        df = pd.read_csv('/tmp/logs.csv')
        
        print(f"[v0] Loaded {len(df)} log entries")
        print(f"[v0] Time range: {df['TimeUTC'].min()} to {df['TimeUTC'].max()}")
        
        # Analyze status codes
        status_counts = Counter(df['responseStatusCode'])
        print("\n[v0] Status Code Distribution:")
        for status, count in status_counts.most_common():
            print(f"  {status}: {count} requests")
        
        # Analyze request paths
        path_counts = Counter(df['requestPath'])
        print("\n[v0] Top Request Paths:")
        for path, count in path_counts.most_common(10):
            print(f"  {path}: {count} requests")
        
        # Analyze messages for errors
        messages = df['message'].dropna()
        error_messages = [msg for msg in messages if any(keyword in str(msg).lower() for keyword in ['error', 'fail', 'exception', 'undefined'])]
        
        print(f"\n[v0] Found {len(error_messages)} error messages:")
        for msg in error_messages[:10]:  # Show first 10 errors
            print(f"  - {msg}")
        
        # Analyze success messages
        success_messages = [msg for msg in messages if 'successfully' in str(msg).lower()]
        print(f"\n[v0] Found {len(success_messages)} success messages:")
        for msg in set(success_messages):  # Show unique success messages
            print(f"  - {msg}")
        
        # Check for authentication issues
        auth_issues = [msg for msg in messages if any(keyword in str(msg).lower() for keyword in ['getuser', 'auth', 'unauthorized', 'login'])]
        if auth_issues:
            print(f"\n[v0] Found {len(auth_issues)} authentication-related messages:")
            for msg in set(auth_issues):
                print(f"  - {msg}")
        
        # Performance analysis
        print(f"\n[v0] Performance Metrics:")
        print(f"  - Total requests: {len(df)}")
        print(f"  - Unique request paths: {len(path_counts)}")
        print(f"  - Cache hits (PRERENDER): {len(df[df['vercelCache'] == 'PRERENDER'])}")
        
        return {
            'total_requests': len(df),
            'status_codes': dict(status_counts),
            'error_count': len(error_messages),
            'success_count': len(success_messages),
            'auth_issues': len(auth_issues)
        }
        
    except Exception as e:
        print(f"[v0] Error analyzing logs: {e}")
        return None

if __name__ == "__main__":
    result = analyze_production_logs()
    if result:
        print(f"\n[v0] Analysis Summary:")
        print(f"  - Total requests: {result['total_requests']}")
        print(f"  - Errors found: {result['error_count']}")
        print(f"  - Success messages: {result['success_count']}")
        print(f"  - Auth issues: {result['auth_issues']}")
