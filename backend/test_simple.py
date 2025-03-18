import requests; r = requests.get("http://localhost:8000/health"); print(f"Status code: {r.status_code}"); print(r.json())
