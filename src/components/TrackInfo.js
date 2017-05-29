/**
 * Created by lukes on 1/25/2017.
 */
import React from 'react';
import PropTypes from 'prop-types';

export default class TrackInfo extends React.Component {
  render() {
    return (
      <div className="track-info base-div">
        <div>{this.props.trackName}</div>
        <div> {this.props.artistName}</div>
        <div>{this.props.albumName}</div>
      </div>
    );
  }
}

TrackInfo.propTypes = {
  trackName: PropTypes.string,
  artistName: PropTypes.string,
  albumName: PropTypes.string,
};
