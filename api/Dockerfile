FROM python:3.10.5-alpine

WORKDIR /app
ADD . /app

# System deps:
RUN apk update && apk add python3-dev \
                        gcc \
                        g++ \
                        libc-dev \
                        libffi-dev

RUN pip install -r requirements.txt

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0"]
