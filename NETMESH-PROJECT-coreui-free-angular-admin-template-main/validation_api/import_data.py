import openpyxl
import psycopg2
from datetime import datetime

DB = {
    "host":     "localhost",
    "port":     5432,
    "database": "validation_db",
    "user":     "postgres",
    "password": "Little3374",  
}

def clean(v):
    if v is None: return None
    if isinstance(v, str) and v.strip().upper() in ("NULL","NONE",""): return None
    return v

print("Reading Excel")
wb = openpyxl.load_workbook("validation_data.xlsx")
ws = wb.active
rows = list(ws.iter_rows(min_row=2, values_only=True))
print(f"   {len(rows)} rows found.")

print("Connecting to PostgreSQL")
conn = psycopg2.connect(**DB)
cur  = conn.cursor()

ok = 0
for r in rows:
    id_, province, city, barangay, location, vdate, vtime, tech, provider, upload, download, signal, remarks = r
    if isinstance(vdate, datetime): vdate = vdate.date()
    vtime_str = vtime.strftime("%H:%M") if vtime else None
    try:
        cur.execute("""
            INSERT INTO validation_data
              (id,province,city_municipality,barangay,location,
               validation_date,validation_time,technology,
               service_provider,upload,download,signal_strength,remarks)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
            ON CONFLICT (id) DO NOTHING
        """, (id_, clean(province), clean(city), clean(barangay), clean(location),
              vdate, vtime_str, clean(tech), clean(provider),
              clean(upload), clean(download), clean(signal), clean(remarks)))
        ok += 1
    except Exception as e:
        print(f"Skipped ID {id_}: {e}")

conn.commit()
conn.close()
print(f"\nDone! {ok} rows imported.")
print("   Now run:  uvicorn main:app --reload")