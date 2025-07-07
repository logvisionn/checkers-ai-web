# syntax=docker/dockerfile:1
FROM python:3.10-slim AS base

WORKDIR /app

# install only requirements
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# copy source
COPY backend/app ./app

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
