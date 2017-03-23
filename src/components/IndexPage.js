/**
 * Created by lukes on 1/21/2017.
 */
import React from 'react';
import ConnectButtons from './ConnectButtons';
import AlbumArt from './AlbumArt';
import MediaButtons from './MediaButtons';
import TrackInfo from './TrackInfo';

const defaultAlbumURL = "./img/default.png";

export default class IndexPage extends React.Component {

    constructor(props) {
        super();
        var userIP = localStorage.getItem("lastIP");

        console.log(userIP);
        if (userIP === null) {
			userIP = "localhost";
        }

        this.state = {
            playState: "glyphicon glyphicon-play",
            trackName: "Track Name",
            artistName: "Artist",
            albumName: "Album Title",
            albumArtURL: defaultAlbumURL,
            connectionStatus: "Connect",
            ipAddress: userIP,
            /*person: this.props.person*/ //Future proofing for multiple connections
        };
    }

    componentDidMount(){

        this.connection = new WebSocket(`ws://${this.state.ipAddress}:5672`);

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
            this.setState({
                connectionStatus: "Disconnect"
            })
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
            alert(`Connection closed at ${this.state.ipAddress}`); //switch to person
            this.setState({
                trackName: "Track Name",
                artistName: "Artist",
                albumName: "Album Title",
                albumArtURL: defaultAlbumURL,
                playState: "glyphicon glyphicon-play",
                connectionStatus: "Connect"
            })
        };
    }

    handleMessage(data) {
        let jsonMessage = JSON.parse(data);

        //Playstate change handler to change glyphicons
        if (jsonMessage.channel === 'playState') {
            if (jsonMessage.payload === true) {
                this.setState({
                    playState: "glyphicon glyphicon-pause"
                })
            }
            else {
                this.setState({
                    playState: "glyphicon glyphicon-play"
                })
            }
        }

        //Track change handler to grab all track info
        if (jsonMessage.channel === 'track') {
            this.setState({
                trackName: jsonMessage.payload.title,
                artistName: jsonMessage.payload.artist,
                albumName: jsonMessage.payload.album,
                albumArtURL: jsonMessage.payload.albumArt
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
                //TODO: get this to change a json file - use react-native-fs?
                //addresses[0].gpmdpAuth = jsonMessage.payload; //change to person
                localStorage.setItem("gpmdpAuth", jsonMessage.payload);
				localStorage.setItem("lastIP", this.state.ipAddress);
            }
        }
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

    handleConnectionToggle() {
        if (this.state.connectionStatus === 'Disconnect') {
            this.connection.close();
        }

        //TODO: Not this - could restate all websocket functions
        else {
			var newIP = window.prompt("New IP:", "");
			localStorage.setItem("lastIP", newIP);
			this.setState({
				ipAddress: newIP
			});

            this.componentDidMount();
        }
    }

    render() {
        return (
            <div className="single-person-div">
                <AlbumArt albumArtURL={this.state.albumArtURL}/>

                <TrackInfo trackName={this.state.trackName}
                           artistName={this.state.artistName}
                           albumName={this.state.albumName}/>

                <MediaButtons rewindClicked={this.handleRewind.bind(this)}
                              skipClicked={this.handleSkip.bind(this)}
                              playClicked={this.handlePlayPause.bind(this)}
                              playState={this.state.playState}/>

                <ConnectButtons connectionClicked={this.handleConnectionToggle.bind(this)}
                                connectionStatus={this.state.connectionStatus}/>
            </div>
        );
    }
}