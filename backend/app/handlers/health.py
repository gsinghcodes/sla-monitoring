from fastapi import FastAPI
from mangum import Mangum

app = FastAPI()
handler = Mangum(app)


@app.get("/api/health")
def get_health():
    return {"status": "OK"}
