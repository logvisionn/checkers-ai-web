FROM python:3.10-slim

WORKDIR /app

# install your Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# copy in your FastAPI app package
COPY app ./app

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
