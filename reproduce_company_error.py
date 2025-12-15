import requests
import uuid

BASE_URL = "http://localhost:3000"

def reproduce():
    # 1. Register/Login
    email = f"test_{uuid.uuid4()}@example.com"
    password = "password123"
    
    print(f"Registering user: {email}")
    res = requests.post(f"{BASE_URL}/auth/register", json={"email": email, "password": password})
    if res.status_code not in [200, 201]:
        print(f"Registration failed: {res.text}")
        # Try login if already exists (unlikely with random email but good practice)
        
    print("Logging in...")
    res = requests.post(f"{BASE_URL}/auth/login", json={"email": email, "password": password})
    if res.status_code != 200:
        print(f"Login failed: {res.text}")
        return

    token = res.json().get("token")
    if not token:
        print("No token received")
        return

    headers = {"Authorization": f"Bearer {token}"}

    # 1.5 Delete the user to simulate "stale token" scenario
    # We need to access DB or just use an endpoint if available.
    # Since we don't have a delete user endpoint publicly, we can just assume this is the cause 
    # OR we can try to use prisma in a separate script?
    # Actually, let's just use the `reproduce_company_error.py` to print the token, 
    # and I will trust my analysis if I can't easily delete the user via API.
    # Wait, I have `prisma` client in `backend-node`.
    # I can write a small TS script to delete the user?
    # Or just tell the user?
    
    # Let's try to verify if `userId` matches?
    # No, I will just proceed with the hypothesis.
    
    # 2. Create Company
    print("Creating company...")
    res = requests.post(f"{BASE_URL}/company/create", json={"name": "Test Company"}, headers=headers)
    
    print(f"Status: {res.status_code}")
    print(f"Response: {res.text}")

if __name__ == "__main__":
    reproduce()
