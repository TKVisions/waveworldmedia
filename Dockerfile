# Use a minimal Debian base image
FROM debian:bullseye

# Create a non-root user for running services
RUN useradd -m icecastuser

# Install required packages
RUN apt-get update && apt-get install -y \
    icecast2 liquidsoap curl && \
    apt-get clean

# Copy configuration files into the image
COPY icecast.xml /etc/icecast2/icecast.xml
COPY radio.liq /etc/liquidsoap/radio.liq
COPY default.m3u /etc/liquidsoap/default.m3u

# Set correct ownership for the config and log directories
RUN chown -R icecastuser /etc/icecast2 /etc/liquidsoap /tmp

# Switch to the non-root user
USER icecastuser

# Expose port 80 (Railway expects port 80 or 3000 for HTTP apps)
EXPOSE 80

# Start Icecast and Liquidsoap together
CMD bash -c "icecast2 -c /etc/icecast2/icecast.xml & sleep 2 && liquidsoap /etc/liquidsoap/radio.liq"



