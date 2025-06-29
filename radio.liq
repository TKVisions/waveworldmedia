live = input.http("http://localhost:8000/live")
default = playlist("/etc/liquidsoap/default.m3u")

radio = fallback([live, default])

output.icecast(
  %mp3,
  host = "localhost",
  port = 8000,
  password = "hackme",
  mount = "/autoplay",
  name = "My Railway Radio",
  genre = "Global Radio",
  description = "Live + fallback radio",
  url = "http://localhost:8000"
)(radio)
