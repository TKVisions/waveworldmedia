live = input.http("http://localhost:8000/live")
default = playlist("/etc/liquidsoap/default.m3u")

radio = fallback([live, default])

output.icecast(
  radio,
  mount = "/autoplay",
  host = "localhost",
  port = 8000,
  password = "hackme",
  name = "My Railway Radio",
  description = "Live + fallback radio",
  genre = "Global Radio",
  url = "http://localhost:8000"
)

