import subprocess
import time
import sys

def debug():
    # Start the server
    process = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "backend.main:app", "--port", "8000"],
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True
    )
    
    # Wait for it to start
    time.sleep(5)
    
    # Run test script
    test_process = subprocess.Popen(
        [sys.executable, "test_step3.py"],
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True
    )
    
    stdout, _ = test_process.communicate()
    print("--- TEST OUTPUT ---")
    print(stdout)
    
    # Terminate and print logs
    process.terminate()
    stdout_server, _ = process.communicate()
    print("--- SERVER LOGS ---")
    print(stdout_server)

if __name__ == "__main__":
    debug()
