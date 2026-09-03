from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from apscheduler.schedulers.background import BackgroundScheduler

from app.database import Base, engine, get_db, SessionLocal
import app.models

from app.routers import patients, monitoring, vitals, alerts, tasks, auth, audit, reports
from app.services.scheduler import run_monitoring_scheduler


def periodic_scheduler_job():
    """Background task running every 60 seconds in production."""
    db = SessionLocal()
    try:
        run_monitoring_scheduler(db)
    except Exception as e:
        print(f"Scheduler background job error: {e}")
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Start background scheduler
    scheduler = BackgroundScheduler()
    scheduler.add_job(periodic_scheduler_job, 'interval', seconds=60)
    scheduler.start()
    print("Background ICU Monitoring Task Scheduler started (interval: 60s).")

    yield

    # Shutdown: Stop scheduler
    scheduler.shutdown()
    print("Background ICU Monitoring Task Scheduler stopped.")


app = FastAPI(
    title="Smart ICU Vital Monitoring System API",
    description="Hospital Automation Solution for ICU Patient Monitoring and Clinical Dashboard",
    version="1.0.0",
    lifespan=lifespan
)


app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=".*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


Base.metadata.create_all(bind=engine)


app.include_router(auth.router)
app.include_router(patients.router)
app.include_router(monitoring.router)
app.include_router(vitals.router)
app.include_router(alerts.router)
app.include_router(tasks.router)
app.include_router(audit.router)
app.include_router(reports.router)


@app.get("/")
def root():
    return {
        "title": "Smart ICU Vital Monitoring System",
        "system": "Hospital Automation Solution",
        "status": "healthy"
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "Smart ICU Vital Monitoring System Backend"
    }


@app.post("/scheduler/run")
def trigger_scheduler(db: Session = Depends(get_db)):
    run_monitoring_scheduler(db)
    return {"status": "success", "message": "Monitoring scheduler and escalation check completed."}