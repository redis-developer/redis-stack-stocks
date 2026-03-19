FROM python:3.13-alpine

WORKDIR /app

COPY requirements.txt .
RUN apk add --no-cache gcc musl-dev libffi-dev && pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
