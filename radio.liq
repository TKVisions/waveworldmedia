# List of active stations you want to support
stations = ["jedfm", "mystation", "beatnation"]

# Function to create a stream per station
def make_station_stream(station_name) =
  def get_next() =
    url = list.hd(get_process_lines("curl -s http://your-api.com/api/station/#{station_name}/next"))
    log("Next track for #{station_name}: #{url}")
    url
  end

  stream = request.dynamic.list(get_next)

  output.icecast(%mp3,
    host = "localhost",
    port = 8000,
    password = "hackme",
    mount = "/station/#{station_name}/live",
    name = "#{station_name} Radio",
    description = "Auto playlist for #{station_name}",
    genre = "Mixed",
    stream)
end

# Start streams for each active station
make_station_stream("jedfm")
make_station_stream("mystation")
make_station_stream("beatnation")
