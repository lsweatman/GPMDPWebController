/**
 * Created by lukes on 1/21/2017.
 */
import React from 'react';
import AlbumArt from './AlbumArt';
import MediaButtons from './MediaButtons';
import TrackInfo from './TrackInfo';
import VolumeSlider from './VolumeSlider';
import Seekbar from './Seekbar';

const defaultAlbumURL = './img/default.png';

export default class IndexPage extends React.Component {
  constructor() {
    super();

    // For keeping track of time without state changes
    this.totalMilli = 0;
    this.currentMilli = 0;

    // Section for binding for ESLint rules
    // Prevents excessive garbage collection
    this.seekBarMouseUp = this.handleSliderMouseUp.bind(this);
    this.seekBarOnChange = this.handleSliderOnChange.bind(this);

    this.volumeMouseUp = this.handleVolumeMouseUp.bind(this);
    this.volumeOnChange = this.handleVolumeChange.bind(this);

    this.rewindClicked = this.handleRewind.bind(this);
    this.playPauseClicked = this.handlePlayPause.bind(this);
    this.skipClicked = this.handleSkip.bind(this);

    this.state = {
      playState: 'glyphicon glyphicon-play',
      trackName: 'Track Name',
      artistName: 'Artist',
      albumName: 'Album Title',
      albumArtURL: defaultAlbumURL,
      volume: 0,
      totalTrackTime: '--:--',
      currentTrackTime: '--:--',
      seekBarPosition: 0,
      /*person: this.props.person*/ // Future proofing for multiple connections
    };
  }

  componentDidMount() {
    this.connection = new WebSocket(`ws://${location.hostname}:5672`);

    this.connection.onmessage = (evt) => {
      this.handleMessage(evt.data);
    };

    this.connection.onopen = () => {
      let connectionJSON;
      if (localStorage.gpmdpAuth === undefined) { // switch to person.Auth
        connectionJSON = {
          namespace: 'connect',
          method: 'connect',
          arguments: ['WebController'],
        };
      } else {
        connectionJSON = {
          namespace: 'connect',
          method: 'connect',
          arguments: ['WebController', localStorage.gpmdpAuth], // switch to person.Auth
        };
      }
      this.connection.send(JSON.stringify(connectionJSON));
    };

    this.connection.onerror = () => {
      alert('Client has been closed');
      this.connection.close();
    };

    this.connection.onclose = () => {
      alert(`Error at ${this.state.ipAddress}`); // switch to person
      this.setState({
        trackName: 'Track Name',
        artistName: 'Artist',
        albumName: 'Album Title',
        albumArtURL: defaultAlbumURL,
        playState: 'glyphicon glyphicon-play',
        volume: 0,
        totalTrackTime: '--:--',
        currentTrackTime: '--:--',
      });
    };
  }

  getCurrentTime() {
    const askCurrentTime = {
      namespace: 'playback',
      method: 'getCurrentTime',
      requestID: 2,
    };
    this.connection.send(JSON.stringify(askCurrentTime));
  }

  getTotalTime() {
    const askTotalTime = {
      namespace: 'playback',
      method: 'getTotalTime',
      requestID: 1,
    };
    this.connection.send(JSON.stringify(askTotalTime));
  }

  handleMessage(data) {
    const jsonMessage = JSON.parse(data);

    // Playstate change handler to change glyphicons
    if (jsonMessage.channel === 'playState') {
      if (jsonMessage.payload === true) {
        // Won't work if user isn't authenticated
        if (localStorage.gpmdpAuth !== undefined) {
          // If the track is playing, start grabbing current track time
          const currentTime = setInterval(() => {
            const askCurrentTime = {
              namespace: 'playback',
              method: 'getCurrentTime',
              requestID: 2,
            };
            this.connection.send(JSON.stringify(askCurrentTime));
          }, 500);

          this.setState({
            pingCurrentTime: currentTime,
          });
        }

        this.setState({
          playState: 'glyphicon glyphicon-pause',
        });
      } else {
        // Clear interval if the track is stopped
        clearInterval(this.state.pingCurrentTime);

        this.setState({
          playState: 'glyphicon glyphicon-play',
        });
      }
    }

    // Track change handler to grab all track info
    if (jsonMessage.channel === 'track') {
      // Ask for total track to suppress excess state changes
      if (localStorage.gpmdpAuth !== undefined) {
        const askTotalTime = {
          namespace: 'playback',
          method: 'getTotalTime',
          requestID: 1,
        };
        this.connection.send(JSON.stringify(askTotalTime));
      }
      // Prevents initial startup issues
      if (jsonMessage.payload.title !== null) {
        this.setState({
          trackName: jsonMessage.payload.title,
          artistName: jsonMessage.payload.artist,
          albumName: jsonMessage.payload.album,
          albumArtURL: jsonMessage.payload.albumArt,
        });
      }
    }

    // Report back player volume changes
    if (jsonMessage.channel === 'volume') {
      this.setState({
        volume: jsonMessage.payload,
      });
    }

    // Initial connection authentication handler
    if (jsonMessage.channel === 'connect') {
      // If the client doesn't have a code already
      if (jsonMessage.payload === 'CODE_REQUIRED') {
        const fourDigitCode = prompt('Enter the 4 digit code (blank to abort)', '');
        if (fourDigitCode === '') {
          this.connection.close();
        }

        const connectionJSON = {
          namespace: 'connect',
          method: 'connect',
          arguments: ['WebController', fourDigitCode],
        };
        this.connection.send(JSON.stringify(connectionJSON));
      } else { // If the user successfully gets a key back
        const authJSON = {
          namespace: 'connect',
          method: 'connect',
          arguments: ['WebController', jsonMessage.payload],
        };
        this.connection.send(JSON.stringify(authJSON));

        localStorage.setItem('gpmdpAuth', jsonMessage.payload);
        this.getTotalTime();
        this.getCurrentTime();
      }
    }

    // Grab time for the seekbar
    if (jsonMessage.namespace === 'result') {
      // Parse time
      let seconds = parseInt((jsonMessage.value / 1000) % 60, 10);
      let minutes = parseInt((jsonMessage.value / (1000 * 60)) % 60, 10);
      let hours = parseInt((jsonMessage.value / (1000 * 60 * 60)) % 24, 10);

      hours = (hours < 10) ? `0${hours}` : hours;
      minutes = (minutes < 10) ? `0${minutes}` : minutes;
      seconds = (seconds < 10) ? `0${seconds}` : seconds;
      // Change the format based on song length
      let formatTime;
      if (hours >= 1) {
        formatTime = `${hours}:${minutes}:${seconds}`;
      } else {
        formatTime = `${minutes}:${seconds}`;
      }

      // Takes return JSON from total time request
      if (jsonMessage.requestID === 1) {
        this.totalMilli = jsonMessage.value;
        this.setState({
          totalTrackTime: formatTime,
        });
      } else if (jsonMessage.requestID === 2) { // Takes return JSON from current time request
        this.currentMilli = jsonMessage.value;
        this.setState({
          currentTrackTime: formatTime,
          seekBarPosition: (this.currentMilli / this.totalMilli) * 100,
        });
      }
    }
  }

  handlePlayPause() {
    const playJSON = {
      namespace: 'playback',
      method: 'playPause',
    };
    this.connection.send(JSON.stringify(playJSON));
  }

  handleSkip() {
    const skipJSON = {
      namespace: 'playback',
      method: 'forward',
    };
    this.connection.send(JSON.stringify(skipJSON));
  }

  handleRewind() {
    const rewindJSON = {
      namespace: 'playback',
      method: 'rewind',
    };
    this.connection.send(JSON.stringify(rewindJSON));
  }

  // For when the mouse up event is fired
  // Used to suppress tons of messages back to GPMDP
  handleVolumeMouseUp(evt) {
    const volumeJSON = {
      namespace: 'volume',
      method: 'setVolume',
      arguments: [evt.target.value],
    };
    this.connection.send(JSON.stringify(volumeJSON));
  }

  handleVolumeChange(evt) {
    this.setState({
      volume: evt.target.value,
    });
  }

  // Reports final selection to GPMDP
  handleSliderMouseUp(evt) {
    // Set Player time position
    const setTimeJSON = {
      namespace: 'playback',
      method: 'setCurrentTime',
      arguments: [(evt.target.value / 100) * this.totalMilli],
    };
    this.connection.send(JSON.stringify(setTimeJSON));

    // Restart the interval if the track is currently playing
    if (this.state.playState === 'glyphicon glyphicon-pause') {
      const currentTime = setInterval(() => {
        const askCurrentTime = {
          namespace: 'playback',
          method: 'getCurrentTime',
          requestID: 2,
        };
        this.connection.send(JSON.stringify(askCurrentTime));
      }, 500);

      this.setState({
        seekBarPosition: evt.target.value,
        pingCurrentTime: currentTime,
      });
    } else {
      // Change the position on the site otherwise interface is locked
      this.setState({
        seekBarPosition: evt.target.value,
      });
    }
  }

  // Clears interval to suppress extra messages
  // Con: Have to mouse up to change time but won't make GPMDP throw errors
  handleSliderOnChange(evt) {
    clearInterval(this.state.pingCurrentTime);
    this.setState({
      seekBarPosition: evt.target.value,
    });
  }

  render() {
    return (
      <div className="single-person-div">
        <AlbumArt albumArtURL={this.state.albumArtURL} />

        <Seekbar
          currentTime={this.state.currentTrackTime}
          totalTime={this.state.totalTrackTime}
          sliderCurrent={this.state.seekBarPosition}
          onMouseUp={this.seekBarMouseUp}
          onChange={this.seekBarOnChange}
        />

        <VolumeSlider
          pVolume={this.state.volume}
          onVolMouseUp={this.volumeMouseUp}
          onVolChange={this.volumeOnChange}
        />

        <TrackInfo
          trackName={this.state.trackName}
          artistName={this.state.artistName}
          albumName={this.state.albumName}
        />

        <MediaButtons
          rewindClicked={this.rewindClicked}
          playClicked={this.playPauseClicked}
          skipClicked={this.skipClicked}
          playState={this.state.playState}
        />
      </div>
    );
  }
}
