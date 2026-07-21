import sys
import json

def calculate_complexity(project):
    difficulty = project.get("difficulty", "Beginner")
    tech_stack = project.get("techStack", [])
    
    score = 0
    # Base score by difficulty
    if difficulty.lower() == "beginner":
        score += 10
    elif difficulty.lower() == "intermediate":
        score += 30
    elif difficulty.lower() == "advanced":
        score += 50
    else:
        score += 20
        
    # Additional score per tech stack item
    score += len(tech_stack) * 5
    
    return min(100, score) # Cap at 100

def main():
    # Read JSON array from standard input
    input_data = sys.stdin.read()
    if not input_data:
        print("[]")
        return
        
    try:
        projects = json.loads(input_data)
        for project in projects:
            project['complexityScore'] = calculate_complexity(project)
        
        # Output modified JSON
        print(json.dumps(projects))
    except Exception as e:
        # In case of error, just print empty array or original string
        print(json.dumps({"error": str(e)}))

if __name__ == "__main__":
    main()
