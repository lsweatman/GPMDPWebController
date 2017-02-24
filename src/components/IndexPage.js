/**
 * Created by lukes on 1/21/2017.
 */
import React from 'react';
import ConnectButtons from './ConnectButtons';
import AlbumArt from './albumArt';
import MediaButtons from './mediaButtons';
import TrackInfo from './TrackInfo';
import addresses from '../data/addresses';

const defaultAlbumURL = "./img/default.png";
//var socket = io();

export default class IndexPage extends React.Component {

    constructor(props) {
        super();
        this.state = {
            playState: "glyphicon glyphicon-play",
            trackName: "Track Name",
            artistName: "Artist",
            albumName: "Album Title",
            albumArtURL: defaultAlbumURL,
            connectionStatus: "Connect",
            /*person: this.props.person*/ //Future proofing for multiple connections
        };
    }

    componentDidMount(){

        this.connection = new WebSocket(`ws://${addresses[0].ip}:5672`);

        this.connection.onmessage = evt => {
            this.handleMessage(evt.data);
        };

        this.connection.onopen = evt => {
            var connectionJSON;
            if (addresses[0].gpmdpAuth === ''){ //switch to person.Auth
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
                    "arguments": ["WebController", addresses[0].gpmdpAuth] //switch to person.Auth
                };
            }
            this.connection.send(JSON.stringify(connectionJSON));
            this.setState({
                connectionStatus: "Disconnect"
            })
        };

        this.connection.onerror = evt => {
            console.log(evt.data);
        };

        this.connection.onclose = evt => {
            alert(`${addresses[0].name} Closed at ${addresses[0].ip}`); //switch to person
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
                var fourDigitCode = prompt("Enter the 4 digit code (xxxx to abort)", "xxxx");
                if (fourDigitCode === "xxxx") {
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
                addresses[0].gpmdpAuth = jsonMessage.payload; //change to person
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