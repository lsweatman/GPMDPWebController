/**
 * Created by lukes on 1/25/2017.
 */
import React from 'react';

export default class TrackInfo extends React.Component {
    render() {
        return (
            <div className="track-info">
                <div>{this.props.trackName}</div>
                <div> {this.props.artistName}</div>
                <div>{this.props.albumName}</div>
            </div>
        )
    }
}