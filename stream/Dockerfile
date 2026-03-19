FROM python:3.13-alpine

WORKDIR /app

COPY requirements.txt .
RUN apk add --no-cache gcc musl-dev libffi-dev && pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["python", "main.py"]
