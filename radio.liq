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
  description = "Live + fallback radio",
  genre = "Global Radio",
  url = "http://localhost:8000"
)(radio)
