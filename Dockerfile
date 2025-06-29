FROM debian:bullseye

RUN apt-get update && apt-get install -y \
    icecast2 liquidsoap curl && \
    apt-get clean

COPY icecast.xml /etc/icecast2/icecast.xml
COPY radio.liq /etc/liquidsoap/radio.liq
COPY default.m3u /etc/liquidsoap/default.m3u

EXPOSE 8000

CMD ["icecast2", "-c", "/etc/icecast2/icecast.xml"]


