FROM debian:bullseye

# Install dependencies
RUN apt-get update && apt-get install -y \
    icecast2 liquidsoap curl && \
    apt-get clean

# Create log directory and set permissions for Icecast to run as nobody
RUN mkdir -p /usr/local/icecast/logs && chown -R nobody:nogroup /usr/local/icecast/logs

# Copy config files
COPY icecast.xml /etc/icecast2/icecast.xml
COPY radio.liq /etc/liquidsoap/radio.liq
COPY default.m3u /etc/liquidsoap/default.m3u

# Expose the correct port
EXPOSE 8000

# Run both services: Icecast2 and Liquidsoap
CMD bash -c "icecast2 -c /etc/icecast2/icecast.xml & sleep 3 && exec liquidsoap /etc/liquidsoap/radio.liq"






