FROM debian:bullseye

# Install Icecast2 and Liquidsoap
RUN apt-get update && apt-get install -y \
    icecast2 liquidsoap curl && \
    apt-get clean

# Create log directory expected by Icecast
RUN mkdir -p /usr/local/icecast/logs

# Copy config files into the container
COPY icecast.xml /etc/icecast2/icecast.xml
COPY radio.liq /etc/liquidsoap/radio.liq
COPY default.m3u /etc/liqu
