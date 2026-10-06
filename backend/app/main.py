from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import auth, game, admin

app = FastAPI(title="Tech Mystery Hunt API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(game.router)
app.include_router(admin.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to the Tech Mystery Hunt API"}
