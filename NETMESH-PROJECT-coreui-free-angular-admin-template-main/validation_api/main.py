from fastapi import FastAPI, HTTPException, Query  
from fastapi.middleware.cors import CORSMiddleware 
from pydantic import BaseModel                    
from typing import Optional, List                  
from contextlib import contextmanager              
from datetime import date                         
import psycopg2                                   
import psycopg2.extras                             

DB_SETTINGS = {
    "host":     "localhost",      
    "port":     5432,             
    "database": "validation_db",   
    "user":     "postgres",      
    "password": "Little3374",     
}

app = FastAPI(
    title="Validation Data REST API",
    description="API for viewing and managing network signal validation records",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   
    allow_methods=["*"],   
    allow_headers=["*"],  
)

@contextmanager
def get_connection():
    connection = psycopg2.connect(**DB_SETTINGS)
    try:
        yield connection 
    finally:
        connection.close() 

class ValidationRecord(BaseModel):
    id:                int            
    province:          Optional[str]  
    city_municipality: Optional[str]  
    barangay:          Optional[str]  
    location:          Optional[str] 
    validation_date:   Optional[date] 
    validation_time:   Optional[str]  
    technology:        Optional[str] 
    service_provider:  Optional[str]  
    upload:            Optional[float]
    download:          Optional[float]
    signal_strength:   Optional[str]  
    remarks:           Optional[str] 

class ValidationInput(BaseModel):
    id:                int
    province:          Optional[str]   = None
    city_municipality: Optional[str]   = None
    barangay:          Optional[str]   = None
    location:          Optional[str]   = None
    validation_date:   Optional[date]  = None
    validation_time:   Optional[str]   = None
    technology:        Optional[str]   = None
    service_provider:  Optional[str]   = None
    upload:            Optional[float] = None
    download:          Optional[float] = None
    signal_strength:   Optional[str]   = None
    remarks:           Optional[str]   = None

@app.get("/", tags=["Health Check"])
def health_check():
    return {
        "status": "running",
        "message": "Validation Data API Running!"
    }


@app.get("/validations", response_model=List[ValidationRecord], tags=["Validations"])
def get_all_records(
    province:         Optional[str] = Query(None, description="Filter by province name"),
    service_provider: Optional[str] = Query(None, description="Filter by: Globe, Smart, or DITO"),
    technology:       Optional[str] = Query(None, description="Filter by: LTE or 5G"),
    limit:            int           = Query(226, le=1000, description="How many records to return"),
):
    filters = []
    values  = []

    if province:
        filters.append("province ILIKE %s")
        values.append(f"%{province}%")

    if service_provider:
        filters.append("service_provider ILIKE %s")
        values.append(f"%{service_provider}%")

    if technology:
        filters.append("technology ILIKE %s")
        values.append(f"%{technology}%")

    where_clause = ("WHERE " + " AND ".join(filters)) if filters else ""
    sql = f"SELECT * FROM validation_data {where_clause} ORDER BY id LIMIT %s"
    values.append(limit)

    with get_connection() as conn:
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cursor.execute(sql, values)
        rows = cursor.fetchall()

    return [dict(row) for row in rows]

