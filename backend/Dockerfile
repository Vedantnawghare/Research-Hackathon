FROM python:3.11-slim

WORKDIR /app

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Initialize DB if needed and expose port
EXPOSE 8000

CMD ["sh", "-c", "python seed_db.py && uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]