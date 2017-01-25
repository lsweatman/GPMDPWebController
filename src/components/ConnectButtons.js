import React from 'react';
import Button from 'react-bootstrap/lib/Button';

export default class ConnectButtons extends React.Component {
    render() {
        return (
            <div className="connect-buttons">
                <Button className="btn btn-primary"
                        onClick={this.props.connectionClicked}>
                    {this.props.connectionStatus}
                </Button>
            </div>
        );
    }
}