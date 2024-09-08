from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from sqlalchemy.orm import Session
import agents
import auth
from database import Base, engine

# Create the database tables
Base.metadata.create_all(bind=engine)

app = FastAPI()

# Include the routers from different modules
app.include_router(auth.router, prefix="/auth", tags=["Auth"])
app.include_router(agents.router, prefix="/agents", tags=["Agents"])

# Serve React's index.html for non-API routes
#@app.get("/{full_path:path}")
#async def serve_react_app():
#    return FileResponse("dist/index.html")

@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    return FileResponse('dist/index.html')

# Mount static files for serving the React frontend
app.mount("/", StaticFiles(directory="dist", html=True), name="static")
