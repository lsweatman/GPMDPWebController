/**
 * Created by lukes on 1/21/2017.
 */
import React from 'react';
import Button from 'react-bootstrap/lib/Button';
import Glyphicon from 'react-bootstrap/lib/Glyphicon';

export default class mediaButtons extends React.Component {
    render() {
        return (
            <div id="media-buttons">
                <button id="rewind-button"
                        className="btn btn-primary btn-circle-sml"
                        onClick={this.props.rewindClicked}>
                    <Glyphicon glyph="glyphicon glyphicon-fast-backward"/>
                </button>

                <Button id="play-button"
                        className="btn-primary btn-circle"
                        onClick={this.props.playClicked} >
                    <Glyphicon glyph={this.props.playState}/>
                </Button>

                <button id="forward-button"
                        className="btn btn-primary btn-circle-sml"
                        onClick={this.props.skipClicked}>
                    <Glyphicon glyph="glyphicon glyphicon-fast-forward"/>
                </button>
            </div>
        );
    }
}