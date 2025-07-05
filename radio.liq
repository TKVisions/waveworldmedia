# List of active stations to stream
stations = ["jedfm", "mystation", "beatnation"]

# Function to generate audio stream per station
def make_station_stream(station_name) =
  # Define a request source that fetches the next track from your API
  def get_next() =
    url = list.hd(get_process_lines("curl -s https://personal-assistant-thobelakene45.replit.app/api/station/#{station_name}/next"))
    log("Station #{station_name}: Now streaming #{url}")
    url
  end

  # Set up the stream using a dynamic list source
  stream = request.dynamic.list(get_next)

  # Broadcast to Icecast
  output.icecast(%mp3,
    host = "localhost",
    port = 8000,
    password = "hackme",
    mount = "/station/#{station_name}/live",
    name = "#{station_name} Radio",
    description = "Auto playlist for #{station_name}",
    genre = "Mixed",
    url = "https://waveworldmedia-production.up.railway.app/station/#{station_name}",
    stream)
end

# Launch stream for each station
ignore(map(make_station_stream, stations))
