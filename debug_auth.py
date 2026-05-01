import subprocess
import time
import httpx
import sys

def debug():
    # Start the server
    process = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "backend.main:app", "--port", "8001"],
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True
    )
    
    # Wait for it to start
    time.sleep(5)
    
    # Make the request
    try:
        response = httpx.post("http://127.0.0.1:8001/api/v1/auth/generate-code")
        print(f"Status: {response.status_code}")
        print(f"Text: {response.text}")
    except Exception as e:
        print(f"Request failed: {e}")
        
    # Terminate and print logs
    process.terminate()
    stdout, _ = process.communicate()
    print("--- SERVER LOGS ---")
    print(stdout)

if __name__ == "__main__":
    debug()
