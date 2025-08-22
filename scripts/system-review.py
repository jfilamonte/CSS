import requests
import pandas as pd
import json
from collections import Counter

def analyze_production_logs():
    """Analyze production logs to identify all system issues"""
    
    # Fetch the latest log file
    log_url = "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logs_result%20%282%29-D6GVGxlDZuS1YJkTQVnv9jqRqq1UuT.csv"
    
    try:
        response = requests.get(log_url)
        if response.status_code == 200:
            # Save and analyze the CSV
            with open('production_logs.csv', 'w') as f:
                f.write(response.text)
            
            df = pd.read_csv('production_logs.csv')
            
            print("=== PRODUCTION LOG ANALYSIS ===")
            print(f"Total log entries: {len(df)}")
            
            # Analyze status codes
            status_counts = df['responseStatusCode'].value_counts()
            print(f"\nStatus Code Distribution:")
            for status, count in status_counts.items():
                print(f"  {status}: {count} requests")
            
            # Analyze request paths
            path_counts = df['requestPath'].value_counts()
            print(f"\nMost Requested Paths:")
            for path, count in path_counts.head(10).items():
                print(f"  {path}: {count} requests")
            
            # Analyze error messages
            error_messages = df[df['message'].notna()]['message'].tolist()
            print(f"\nError Messages Found:")
            for i, msg in enumerate(error_messages[:5]):  # Show first 5 errors
                print(f"  {i+1}. {msg[:100]}...")
            
            return df
        else:
            print(f"Failed to fetch logs: {response.status_code}")
            return None
            
    except Exception as e:
        print(f"Error analyzing logs: {e}")
        return None

def create_system_review():
    """Create comprehensive system review and fix plan"""
    
    print("\n=== COMPREHENSIVE SYSTEM REVIEW ===")
    
    # Critical Issues Identified
    issues = {
        "CRITICAL": [
            "Admin portal shows import error for '@supabase/ssr' - prevents page loading",
            "Database UUID errors - passing strings instead of UUIDs",
            "Supabase client undefined in production - authentication failures",
            "Missing database tables (files, project_files) causing 404 errors"
        ],
        "HIGH": [
            "Button functionality not working - forms don't submit",
            "API routes returning 500 errors",
            "Gallery upload/display failing",
            "Missing navigation between admin pages"
        ],
        "MEDIUM": [
            "Error logging system causing import conflicts",
            "Database constraint violations for required fields",
            "Missing edit/update functionality for existing records"
        ]
    }
    
    # Fix Plan
    fix_plan = {
        "Phase 1 - Emergency Fixes (Immediate)": [
            "1. Replace @supabase/ssr imports with working alternatives",
            "2. Fix UUID generation for database operations", 
            "3. Create simplified admin portal without complex authentication",
            "4. Add proper error boundaries and fallbacks"
        ],
        "Phase 2 - Core Functionality (Next)": [
            "1. Fix all API routes to use correct database tables",
            "2. Implement proper form validation and submission",
            "3. Add missing CRUD operations (Create, Read, Update, Delete)",
            "4. Fix gallery image upload and display"
        ],
        "Phase 3 - Polish & Features (Final)": [
            "1. Add navigation between admin pages",
            "2. Implement proper error logging without import conflicts",
            "3. Add data validation and user feedback",
            "4. Test all functionality end-to-end"
        ]
    }
    
    print("\n=== IDENTIFIED ISSUES ===")
    for priority, issue_list in issues.items():
        print(f"\n{priority} PRIORITY:")
        for issue in issue_list:
            print(f"  • {issue}")
    
    print("\n=== COMPREHENSIVE FIX PLAN ===")
    for phase, tasks in fix_plan.items():
        print(f"\n{phase}:")
        for task in tasks:
            print(f"  {task}")
    
    return issues, fix_plan

if __name__ == "__main__":
    # Analyze logs
    df = analyze_production_logs()
    
    # Create system review
    issues, plan = create_system_review()
    
    print("\n=== NEXT STEPS ===")
    print("1. Execute Phase 1 emergency fixes immediately")
    print("2. Deploy and test each phase before proceeding")
    print("3. Monitor production logs after each deployment")
    print("4. Validate all admin portal functionality works end-to-end")
