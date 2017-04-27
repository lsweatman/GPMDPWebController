/**
 * Created by lukes on 1/21/2017.
 */
import React from 'react';
import AlbumArt from './AlbumArt';
import MediaButtons from './MediaButtons';
import TrackInfo from './TrackInfo';
import VolumeSlider from './VolumeSlider';
import Seekbar from './Seekbar';

const defaultAlbumURL = "./img/default.png";

export default class IndexPage extends React.Component {

	constructor(props) {
		super();

		this.state = {
			playState: "glyphicon glyphicon-play",
			trackName: "Track Name",
			artistName: "Artist",
			albumName: "Album Title",
			albumArtURL: defaultAlbumURL,
			volume: 0,
			totalTrackTime: "--:--",
			currentTrackTime: "--:--",
			/*person: this.props.person*/ //Future proofing for multiple connections
		};
	}

	componentDidMount(){

		this.connection = new WebSocket(`ws://${location.hostname}:5672`);

		this.connection.onmessage = evt => {
			this.handleMessage(evt.data);
		};

		this.connection.onopen = evt => {
			var connectionJSON;
			if (localStorage.gpmdpAuth === null){ //switch to person.Auth
				connectionJSON = {
					"namespace": "connect",
					"method": "connect",
					"arguments": ["WebController"]
				};
			}
			else {
				connectionJSON = {
					"namespace": "connect",
					"method": "connect",
					"arguments": ["WebController", localStorage.gpmdpAuth] //switch to person.Auth
				};
			}
			this.connection.send(JSON.stringify(connectionJSON));
		};

		this.connection.onerror = evt => {
			var newIP = window.prompt("Last stored IP not available. New IP:", "");
			localStorage.setItem("lastIP", newIP);
			this.setState({
				ipAddress: newIP
			});

			//TODO: Still not this
			this.componentDidMount();
		};

		this.connection.onclose = evt => {
			alert(`Error at ${this.state.ipAddress}`); //switch to person
			this.setState({
				trackName: "Track Name",
				artistName: "Artist",
				albumName: "Album Title",
				albumArtURL: defaultAlbumURL,
				playState: "glyphicon glyphicon-play",
				volume: 0,
				totalTrackTime: "--:--",
				currentTrackTime: "--:--",
			})
		};
	}

	handleMessage(data) {
		let jsonMessage = JSON.parse(data);

		//Playstate change handler to change glyphicons
		if (jsonMessage.channel === 'playState') {
			if (jsonMessage.payload === true) {
				
				//If the track is playing, start grabbing current track time
				var pingCurrentTime = setInterval(this.getCurrentTime, 500);
				
				this.setState({
					playState: "glyphicon glyphicon-pause"
				});
			}
			else {
				
				//Clear interval if the track is stopped
				clearInterval(pingCurrentTime);
				
				this.setState({
					playState: "glyphicon glyphicon-play"
				});
			}
		}

		//Track change handler to grab all track info
		if (jsonMessage.channel === 'track') {
			
			//Ask for total track to suppress excess state changes
			this.getTotalTime();
			
			this.setState({
				trackName: jsonMessage.payload.title,
				artistName: jsonMessage.payload.artist,
				albumName: jsonMessage.payload.album,
				albumArtURL: jsonMessage.payload.albumArt
			});
		}

		//Report back player volume changes
		if (jsonMessage.channel === 'volume') {
			this.setState({
				volume: jsonMessage.payload
			});
		}

		//Initial connection authentication handler
		if (jsonMessage.channel === 'connect' ) {
			if (jsonMessage.payload === 'CODE_REQUIRED') {
				var fourDigitCode = prompt("Enter the 4 digit code (blank to abort)", "xxxx");
				if (fourDigitCode === "") {
					this.connection.close();
				}
				var connectionJSON = {
					"namespace": "connect",
					"method": "connect",
					"arguments": ["WebController", fourDigitCode]
				};
				this.connection.send(JSON.stringify(connectionJSON));
			}
			else {
				var authJSON = {
					"namespace": "connect",
					"method": "connect",
					"arguments": ["WebController", jsonMessage.payload]
				};
				this.connection.send(JSON.stringify(authJSON));

				localStorage.setItem("gpmdpAuth", jsonMessage.payload);
			}
		}
		
		//Grab time for the seekbar
		if (jsonMessage.channel === 'result') {
			if (jsonMessage.requestID === 1) {
				var milliseconds = jsonMessage.value;
				milliseconds /= 1000;
				var seconds = milliseconds % 60;
				milliseconds /= 60;
				var minutes = milliseconds % 60;
				var formatTime = minutes + ":" + seconds;
				
				this.setState({
					totalTrackTime: formatTime,
				});
			}	
			else if (jsonMessage.requestID === 2) {
				var milliseconds = jsonMessage.value;
				milliseconds /= 1000;
				var seconds = milliseconds % 60;
				milliseconds /= 60;
				var minutes = milliseconds % 60;
				var formatTime = minutes + ":" + seconds;
				
				this.setState({
					currentTrackTime: formatTime,
				})
			}
		}
	}

	getCurrentTime() {
		const askCurrentTime = {
			"namespace": "playback",
			"method": "getCurrentTime",
			"requestID": 2
		}
		this.connection.send(JSON.stringify(askCurrentTime));
	}

	getTotalTime() {
		const askTotalTime = {
			"namespace": "playback",
			"method": "getTotalTime",
			"requestID": 1
		}
		this.connection.send(JSON.stringify(asktotalTime));
	}

	handlePlayPause() {
		const playJSON = {
			"namespace": "playback",
			"method": "playPause"
		};
		this.connection.send(JSON.stringify(playJSON));
	}

	handleSkip() {
		var skipJSON = {
			"namespace": "playback",
			"method": "forward"
		};
		this.connection.send(JSON.stringify(skipJSON));
	}

	handleRewind() {
		const rewindJSON = {
			"namespace": "playback",
			"method": "rewind"
		};
		this.connection.send(JSON.stringify(rewindJSON));
	}

	handleVolumeChange(evt) {
		//TODO: Have this not only change on mouseup event
		var volumeJSON = {
			"namespace": "volume",
			"method": "setVolume",
			"arguments": [evt.target.value]
		};
		this.connection.send(JSON.stringify(volumeJSON));

		this.setState({
			volume: evt.target.value
		});
	}

	render() {
		return (
			<div className="single-person-div">
				<AlbumArt albumArtURL={this.state.albumArtURL}/>

				<Seekbar currentTime={this.state.currentTrackTime}
						 totalTime={this.state.totalTrackTime}/>
				
				<VolumeSlider pVolume={this.state.volume}
							  onChange={this.handleVolumeChange.bind(this)}/>

				<TrackInfo trackName={this.state.trackName}
						   artistName={this.state.artistName}
						   albumName={this.state.albumName}/>

				<MediaButtons rewindClicked={this.handleRewind.bind(this)}
							  skipClicked={this.handleSkip.bind(this)}
							  playClicked={this.handlePlayPause.bind(this)}
							  playState={this.state.playState}/>
			</div>
		);
	}
}