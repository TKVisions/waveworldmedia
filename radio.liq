# Play the default.m3u playlist in a loop
playlist = playlist(mode="loop", "/etc/liquidsoap/default.m3u")

# Output stream to Icecast
output.icecast(%mp3,
  host = "localhost",
  port = 8000,
  password = "hackme",
  mount = "live",
  name = "JedFM Auto Stream",
  description = "Streaming uploaded songs",
  genre = "Mixed",
  playlist
)
