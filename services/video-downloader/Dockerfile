# ShowOnce video downloader: yt-dlp + ffmpeg + Node.js (YouTube JS challenges).
FROM python:3.12-slim

RUN apt-get update \
 && apt-get install -y --no-install-recommends ffmpeg nodejs ca-certificates \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY server.py .

# DOWNLOADER_TOKEN must be supplied at runtime; the service refuses to start
# without it. Bind PORT (default 8080) behind your platform's HTTPS endpoint.
ENV PORT=8080
EXPOSE 8080
USER nobody
CMD ["python3", "server.py"]
