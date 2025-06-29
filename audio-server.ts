import express from 'express';
import cors from 'cors';
import { spawn, ChildProcess } from 'child_process';
import { writeFileSync, existsSync } from 'fs';
import path from 'path';

const app = express();
const PORT = process.env.PORT || 3001;

// CORS configuration to allow your main Replit app
app.use(cors({
  origin: [
    'https://1751131453582.replit.app',
    'http://localhost:5000',
    process.env.MAIN_APP_URL || ''
  ].filter(Boolean),
  credentials: true
}));

app.use(express.json());

// Audio streaming infrastructure
class RailwayAudioManager {
  private icecastProcess: ChildProcess | null = null;
  private liquidsoapProcess: ChildProcess | null = null;
  private configPath = './icecast.xml';
  private playlistPath = './playlist.m3u';
  private liquidsoapConfigPath = './station.liq';

  constructor() {
    this.setupIcecastConfig();
    this.setupLiquidsoapConfig();
  }

  setupIcecastConfig() {
    const icecastConfig = `<?xml version="1.0"?>
<icecast>
    <location>Railway Cloud</location>
    <admin>admin@waveworldmedia.com</admin>
    <limits>
        <clients>1000</clients>
        <sources>10</sources>
        <queue-size>524288</queue-size>
        <client-timeout>30</client-timeout>
        <header-timeout>15</header-timeout>
        <source-timeout>10</source-timeout>
        <burst-on-connect>1</burst-on-connect>
        <burst-size>65535</burst-size>
    </limits>
    <authentication>
        <source-password>hackme</source-password>
        <relay-password>hackme</relay-password>
        <admin-user>admin</admin-user>
        <admin-password>adminpass</admin-password>
    </authentication>
    <hostname>0.0.0.0</hostname>
    <listen-socket>
        <port>8000</port>
        <bind-address>0.0.0.0</bind-address>
    </listen-socket>
    <mount type="normal">
        <mount-name>/live</mount-name>
        <username>source</username>
        <password>hackme</password>
        <max-listeners>500</max-listeners>
        <dump-file>/tmp/live.dump</dump-file>
        <burst-size>65536</burst-size>
        <fallback-mount>/autoplay</fallback-mount>
        <fallback-override>1</fallback-override>
    </mount>
    <mount type="normal">
        <mount-name>/autoplay</mount-name>
        <username>source</username>
        <password>hackme</password>
        <max-listeners>1000</max-listeners>
        <public>1</public>
        <stream-name>WaveWorldMedia Auto Stream</stream-name>
        <stream-description>Automated playlist broadcasting</stream-description>
        <stream-url>https://waveworldmedia.com</stream-url>
        <genre>Various</genre>
        <bitrate>128</bitrate>
    </mount>
    <fileserve>1</fileserve>
    <paths>
        <basedir>/tmp</basedir>
        <logdir>/tmp</logdir>
        <webroot>/usr/share/icecast/web</webroot>
        <adminroot>/usr/share/icecast/admin</adminroot>
        <alias source="/" destination="/status.xsl"/>
    </paths>
    <logging>
        <accesslog>/tmp/icecast_access.log</accesslog>
        <errorlog>/tmp/icecast_error.log</errorlog>
        <loglevel>3</loglevel>
        <logsize>10000</logsize>
    </logging>
    <security>
        <chroot>0</chroot>
    </security>
</icecast>`;
    
    writeFileSync(this.configPath, icecastConfig);
  }

  setupLiquidsoapConfig() {
    const liquidsoapConfig = `#!/usr/bin/liquidsoap

# Basic settings
set("log.level", 3)
set("log.file.path", "/tmp/liquidsoap.log")

# Live input from Icecast /live mount (where BUTT connects)
live = input.http("http://localhost:8000/live", timeout=30.0)

# Default playlist from uploaded songs
playlist = playlist(reload=30, "/tmp/playlist.m3u")

# Create a fallback: live takes priority, then playlist
radio = fallback(track_sensitive=false, [live, playlist])

# Output to Icecast
output.icecast(%mp3(bitrate=128),
  host="localhost", port=8000, password="hackme",
  mount="/autoplay", name="WaveWorldMedia Stream",
  description="Professional Radio Broadcasting",
  genre="Various", url="https://waveworldmedia.com",
  radio)

# Keep the script running
while true do
  thread.run.recurrent(delay=1.0, fun () -> ())
end`;

    writeFileSync(this.liquidsoapConfigPath, liquidsoapConfig);
  }

  startIcecast() {
    if (this.icecastProcess) {
      console.log('Icecast already running');
      return false;
    }

    console.log('Starting Icecast server on Railway...');
    this.icecastProcess = spawn('icecast', ['-c', this.configPath, '-b'], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    this.icecastProcess.stdout?.on('data', (data) => {
      console.log('Icecast:', data.toString());
    });

    this.icecastProcess.stderr?.on('data', (data) => {
      console.error('Icecast error:', data.toString());
    });

    this.icecastProcess.on('close', (code) => {
      console.log('Icecast process closed with code:', code);
      this.icecastProcess = null;
    });

    return true;
  }

  startLiquidsoap(playlist: string[]) {
    if (this.liquidsoapProcess) {
      this.liquidsoapProcess.kill('SIGTERM');
    }

    // Update playlist
    const playlistContent = playlist.join('\\n');
    writeFileSync('/tmp/playlist.m3u', playlistContent);
    console.log('Updated playlist with', playlist.length, 'songs');

    console.log('Starting Liquidsoap on Railway...');
    this.liquidsoapProcess = spawn('liquidsoap', [this.liquidsoapConfigPath], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    this.liquidsoapProcess.stdout?.on('data', (data) => {
      console.log('Liquidsoap:', data.toString());
    });

    this.liquidsoapProcess.stderr?.on('data', (data) => {
      console.error('Liquidsoap error:', data.toString());
    });

    this.liquidsoapProcess.on('close', (code) => {
      console.log('Liquidsoap process closed with code:', code);
      this.liquidsoapProcess = null;
    });

    return true;
  }

  stopAll() {
    if (this.liquidsoapProcess) {
      this.liquidsoapProcess.kill('SIGTERM');
      this.liquidsoapProcess = null;
    }
    if (this.icecastProcess) {
      this.icecastProcess.kill('SIGTERM');
      this.icecastProcess = null;
    }
  }

  getStatus() {
    return {
      icecast: !!this.icecastProcess,
      liquidsoap: !!this.liquidsoapProcess,
      streamUrl: process.env.RAILWAY_STATIC_URL ? 
        `https://${process.env.RAILWAY_STATIC_URL}:8000/autoplay` : 
        'http://localhost:8000/autoplay',
      liveUrl: process.env.RAILWAY_STATIC_URL ? 
        `https://${process.env.RAILWAY_STATIC_URL}:8000/live` : 
        'http://localhost:8000/live'
    };
  }

  async checkLiveStatus() {
    try {
      const response = await fetch("http://localhost:8000/admin/listmounts", {
        headers: {
          'Authorization': 'Basic ' + Buffer.from('admin:adminpass').toString('base64')
        }
      });
      const xmlText = await response.text();
      return xmlText.includes('mount="/live"');
    } catch (error) {
      return false;
    }
  }
}

const audioManager = new RailwayAudioManager();

// API Routes
app.get('/health', (req, res) => {
  res.json({ status: 'Railway Audio Backend Online', timestamp: new Date().toISOString() });
});

app.get('/status', (req, res) => {
  res.json(audioManager.getStatus());
});

app.post('/start-station', (req, res) => {
  const { playlist } = req.body;
  
  try {
    audioManager.startIcecast();
    setTimeout(() => {
      audioManager.startLiquidsoap(playlist || []);
      res.json({ success: true, message: 'Station started on Railway' });
    }, 3000); // Wait for Icecast to fully start
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/stop-station', (req, res) => {
  try {
    audioManager.stopAll();
    res.json({ success: true, message: 'Station stopped' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/live-status', async (req, res) => {
  try {
    const isLive = await audioManager.checkLiveStatus();
    res.json({ isLiveConnected: isLive });
  } catch (error) {
    res.json({ isLiveConnected: false });
  }
});

app.post('/update-playlist', (req, res) => {
  const { playlist } = req.body;
  
  try {
    const playlistContent = playlist.join('\\n');
    writeFileSync('/tmp/playlist.m3u', playlistContent);
    res.json({ success: true, message: 'Playlist updated' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Initialize audio infrastructure on startup
audioManager.startIcecast();
setTimeout(() => {
  audioManager.startLiquidsoap([]);
}, 5000);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🎵 Railway Audio Backend running on port ${PORT}`);
  console.log('🎧 Audio streaming infrastructure initialized');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Shutting down audio backend...');
  audioManager.stopAll();
  process.exit(0);
});