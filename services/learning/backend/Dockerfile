FROM python:3.13-slim
WORKDIR /app
COPY backend/showonce /app/showonce
RUN useradd --uid 10001 --create-home app && mkdir /data && chown app:app /data
USER app
ENV SHOWONCE_HOST=0.0.0.0 SHOWONCE_PORT=8000 SHOWONCE_DB=/data/showonce.sqlite3
EXPOSE 8000
VOLUME ["/data"]
CMD ["python", "-m", "showonce.server"]
