/**
 * Created by lukes on 1/21/2017.
 */
import React from 'react';

export default class albumArt extends React.Component {
    render() {
        return (
            <div className="album-art-div">
                <img id="album-art-box"
                     src={this.props.albumArtURL}/>
            </div>
        );
    }
}