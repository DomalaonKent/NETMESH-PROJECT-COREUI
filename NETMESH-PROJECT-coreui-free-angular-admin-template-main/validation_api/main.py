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

@app.get("/", tags=["Check"])
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


@app.get("/validations/stats/summary", tags=["Statistics"])
def get_summary_stats():
    with get_connection() as conn:
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cursor.execute("""
            SELECT
                COUNT(*)                             AS total_records,
                COUNT(DISTINCT province)             AS total_provinces,
                COUNT(DISTINCT service_provider)     AS total_providers,
                ROUND(AVG(upload)::numeric, 2)       AS average_upload_mbps,
                ROUND(AVG(download)::numeric, 2)     AS average_download_mbps,
                ROUND(MAX(upload)::numeric, 2)       AS max_upload_mbps,
                ROUND(MAX(download)::numeric, 2)     AS max_download_mbps
            FROM validation_data
        """)
        result = cursor.fetchone()
    return dict(result)

@app.get("/validations/stats/by-provider", tags=["Statistics"])
def get_stats_by_provider():
    with get_connection() as conn:
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cursor.execute("""
            SELECT
                service_provider,
                COUNT(*)                             AS total_records,
                ROUND(AVG(upload)::numeric, 2)       AS average_upload_mbps,
                ROUND(AVG(download)::numeric, 2)     AS average_download_mbps
            FROM validation_data
            WHERE service_provider IS NOT NULL
            GROUP BY service_provider
            ORDER BY average_download_mbps DESC
        """)
        results = cursor.fetchall()
    return results

@app.get("/validations/{record_id}", response_model=ValidationRecord, tags=["Validations"])
def get_one_record(record_id: int):
    with get_connection() as conn:
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cursor.execute(
            "SELECT * FROM validation_data WHERE id = %s",
            (record_id,)
        )
        row = cursor.fetchone()

    if not row:
        raise HTTPException(
            status_code=404,
            detail=f"Record with ID {record_id} was not found."
        )
    return dict(row)

@app.post("/validations", response_model=ValidationRecord, status_code=201, tags=["Validations"])
def create_record(record: ValidationInput):
    with get_connection() as conn:
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        try:
            cursor.execute("""
                INSERT INTO validation_data (
                    id, province, city_municipality, barangay, location,
                    validation_date, validation_time, technology,
                    service_provider, upload, download, signal_strength, remarks
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING *
            """, (
                record.id, record.province, record.city_municipality,
                record.barangay, record.location, record.validation_date,
                record.validation_time, record.technology, record.service_provider,
                record.upload, record.download, record.signal_strength, record.remarks,
            ))
            conn.commit()
            new_record = cursor.fetchone()

        except psycopg2.errors.UniqueViolation:
            raise HTTPException(
                status_code=400,
                detail=f"Record with ID {record.id} already exists."
            )
    return dict(new_record)

@app.put("/validations/{record_id}", response_model=ValidationRecord, tags=["Validations"])
def update_record(record_id: int, record: ValidationInput):
    with get_connection() as conn:
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cursor.execute("""
            UPDATE validation_data
            SET
                province          = %s,
                city_municipality = %s,
                barangay          = %s,
                location          = %s,
                validation_date   = %s,
                validation_time   = %s,
                technology        = %s,
                service_provider  = %s,
                upload            = %s,
                download          = %s,
                signal_strength   = %s,
                remarks           = %s
            WHERE id = %s
            RETURNING *
        """, (
            record.province, record.city_municipality, record.barangay,
            record.location, record.validation_date, record.validation_time,
            record.technology, record.service_provider, record.upload,
            record.download, record.signal_strength, record.remarks,
            record_id,
        ))
        conn.commit()
        updated_record = cursor.fetchone()

    if not updated_record:
        raise HTTPException(
            status_code=404,
            detail=f"Record with ID {record_id} was not found."
        )
    return dict(updated_record)

@app.delete("/validations/{record_id}", tags=["Validations"])
def delete_record(record_id: int):
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "DELETE FROM validation_data WHERE id = %s RETURNING id",
            (record_id,)
        )
        conn.commit()
        deleted = cursor.fetchone()

    if not deleted:
        raise HTTPException(
            status_code=404,
            detail=f"Record with ID {record_id} was not found."
        )
    return {"message": f"Record {record_id} has been deleted."}