import requests
import csv
import io
from collections import Counter

def analyze_production_logs():
    """Analyze production logs to understand error patterns"""
    
    # Fetch the CSV data
    url = "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logs_result%20%281%29-b65i56jQ66c1U1sdT62czx1KmVnoTI.csv"
    
    try:
        response = requests.get(url)
        response.raise_for_status()
        
        # Parse CSV data
        csv_data = csv.DictReader(io.StringIO(response.text))
        
        errors = []
        paths = []
        status_codes = []
        
        for row in csv_data:
            if row.get('message') and 'Error' in row.get('message', ''):
                errors.append(row.get('message', ''))
            
            paths.append(row.get('requestPath', ''))
            status_codes.append(row.get('responseStatusCode', ''))
        
        print("[v0] Production Log Analysis:")
        print(f"[v0] Total log entries analyzed: {len(list(csv_data))}")
        
        print(f"\n[v0] Error Messages Found: {len(errors)}")
        for i, error in enumerate(errors[:5]):  # Show first 5 errors
            print(f"[v0] Error {i+1}: {error[:200]}...")
        
        print(f"\n[v0] Request Paths:")
        path_counts = Counter(paths)
        for path, count in path_counts.most_common(10):
            print(f"[v0] {path}: {count} requests")
        
        print(f"\n[v0] Status Codes:")
        status_counts = Counter(status_codes)
        for status, count in status_counts.most_common():
            print(f"[v0] {status}: {count} responses")
            
    except Exception as e:
        print(f"[v0] Error analyzing logs: {e}")

if __name__ == "__main__":
    analyze_production_logs()
