import subprocess
import time
import sys

def debug():
    print("Starting temporary server on port 8001 to ensure new tables are created...")
    # Start the server on an alternate port
    process = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "backend.main:app", "--port", "8001"],
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True
    )
    
    # Wait for startup and table creation
    time.sleep(5)
    
    print("Running test_step4.py against the new server...")
    # We must patch test_step4.py to use port 8001 for this test
    with open("test_step4.py", "r") as f:
        content = f.read()
    content = content.replace("8000", "8001")
    with open("test_step4.py", "w") as f:
        f.write(content)
        
    test_process = subprocess.Popen(
        [sys.executable, "test_step4.py"],
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True
    )
    
    stdout, _ = test_process.communicate()
    print("--- TEST OUTPUT ---")
    print(stdout)
    
    # Revert test_step4.py
    content = content.replace("8001", "8000")
    with open("test_step4.py", "w") as f:
        f.write(content)
    
    # Terminate and print logs if any error
    process.terminate()
    stdout_server, _ = process.communicate()
    if "ERROR" in stdout_server:
        print("--- SERVER ERRORS ---")
        for line in stdout_server.splitlines():
            if "ERROR" in line or "Traceback" in line:
                print(line)

if __name__ == "__main__":
    debug()
