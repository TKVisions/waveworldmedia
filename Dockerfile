FROM debian:bullseye

# Create icecast user
RUN useradd -m icecast

# Install dependencies
RUN apt-get update && apt-get install -y \
    icecast2 liquidsoap curl && \
    apt-get clean

# Copy configs
COPY icecast.xml /etc/icecast2/icecast.xml
COPY radio.liq /etc/liquidsoap/radio.liq
COPY default.m3u /etc/liquidsoap/default.m3u

# Fix permissions
RUN chown -R icecast:icecast /etc/icecast2 /etc/liquidsoap

# Expose Icecast port
EXPOSE 8000

# Switch to non-root user
USER icecast

# Start Icecast only (you can add liquidsoap after it works)
CMD ["icecast2", "-c", "/etc/icecast2/icecast.xml"]





