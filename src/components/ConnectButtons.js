import React from 'react';
import Button from 'react-bootstrap/lib/Button';

export default class ConnectButtons extends React.Component {
    render() {
        return (
            <div className="connect-buttons base-div">
                <Button className="btn btn-primary button-no-drag"
                        onClick={this.props.connectionClicked}>
                    {this.props.connectionStatus}
                </Button>
            </div>
        );
    }
}