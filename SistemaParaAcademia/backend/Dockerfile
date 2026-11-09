FROM python:3.13-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

COPY backend/requirements.txt /app/backend/requirements.txt
RUN python -m pip install --upgrade pip \
    && python -m pip install -r /app/backend/requirements.txt

COPY backend/ /app/backend/

RUN chmod +x /app/backend/entrypoint.sh \
    && adduser --system --uid 10001 --group appuser \
    && chown -R appuser:appuser /app

USER appuser

WORKDIR /app/backend

EXPOSE 8000 8001

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD python -c "import sys, urllib.request; sys.exit(0 if urllib.request.urlopen('http://127.0.0.1:8000/docs', timeout=3).getcode() == 200 else 1)"

ENTRYPOINT ["/app/backend/entrypoint.sh"]
