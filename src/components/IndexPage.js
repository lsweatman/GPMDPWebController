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
		var totalMilli = 0;
		var currentMilli = 0;
		this.state = {
			playState: "glyphicon glyphicon-play",
			trackName: "Track Name",
			artistName: "Artist",
			albumName: "Album Title",
			albumArtURL: defaultAlbumURL,
			volume: 0,
			totalTrackTime: "--:--",
			currentTrackTime: "--:--",
			seekBarPosition: 0,
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
			//console.log("playstate hit");
			if (jsonMessage.payload === true) {
				
				//If the track is playing, start grabbing current track time
				var pingCurrentTime = setInterval(() => {
                    const askCurrentTime = {
                        "namespace": "playback",
                        "method": "getCurrentTime",
                        "requestID": 2
                    };
                    this.connection.send(JSON.stringify(askCurrentTime));
				}, 500);
				
				this.setState({
					pingCurrentTime: pingCurrentTime,
					playState: "glyphicon glyphicon-pause"
				});
			}
			else {
				
				//Clear interval if the track is stopped
				clearInterval(this.state.pingCurrentTime);
				
				this.setState({
					playState: "glyphicon glyphicon-play"
				});
			}
		}

		//Track change handler to grab all track info
		if (jsonMessage.channel === 'track') {
			
			//Ask for total track to suppress excess state changes
            const askTotalTime = {
                "namespace": "playback",
                "method": "getTotalTime",
                "requestID": 1
            };
            this.connection.send(JSON.stringify(askTotalTime));
			
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
		if (jsonMessage.namespace === 'result') {

           /* var milliseconds = jsonMessage.value;
			 milliseconds /= 1000;
			 var seconds = milliseconds % 60;
			 milliseconds /= 60;
			 var minutes = milliseconds / 60;*/
			//TODO: Redo this
            var milliseconds = parseInt((jsonMessage.value%1000)/100)
                , seconds = parseInt((jsonMessage.value/1000)%60)
                , minutes = parseInt((jsonMessage.value/(1000*60))%60)
                , hours = parseInt((jsonMessage.value/(1000*60*60))%24);

            hours = (hours < 10) ? "0" + hours : hours;
            minutes = (minutes < 10) ? "0" + minutes : minutes;
            seconds = (seconds < 10) ? "0" + seconds : seconds;

            var formatTime = minutes + ":" + seconds;

			if (jsonMessage.requestID === 1) {
				this.totalMilli = jsonMessage.value;
				this.setState({
					totalTrackTime: formatTime,
				});
			}	
			else if (jsonMessage.requestID === 2) {
				this.currentMilli = jsonMessage.value;
				this.setState({
					currentTrackTime: formatTime,
					seekBarPosition: (this.currentMilli / this.totalMilli) * 100,
				})
			}
		}
	}

	getCurrentTime() {
		const askCurrentTime = {
			"namespace": "playback",
			"method": "getCurrentTime",
			"requestID": 2
		};
		this.connection.send(JSON.stringify(askCurrentTime));
	}

	getTotalTime() {
		const askTotalTime = {
			"namespace": "playback",
			"method": "getTotalTime",
			"requestID": 1
		};
		this.connection.send(JSON.stringify(askTotalTime));
	}

	handlePlayPause() {
		//console.log("playpause hit");
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
	}
	
	handleSliderChange(evt) {
		var setTimeJSON = {
			"namespace": "playback",
			"method": "setCurrentTime",
			"arguments": [(evt.target.value / 100) * this.totalMilli]
		};
		this.connection.send(JSON.stringify(setTimeJSON));
	}

	render() {
		return (
			<div className="single-person-div">
				<AlbumArt albumArtURL={this.state.albumArtURL}/>

				<Seekbar currentTime={this.state.currentTrackTime}
						 totalTime={this.state.totalTrackTime}
						 sliderCurrent={this.state.seekBarPosition}
						 onInput={this.handleSliderChange.bind(this)}/>
				
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