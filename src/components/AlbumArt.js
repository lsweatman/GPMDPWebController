/**
 * Created by lukes on 1/21/2017.
 */
import React from 'react';
import PropTypes from 'prop-types';

export default class albumArt extends React.Component {
  render() {
    return (
      <div className="album-art-div base-div">
        <img
          id="album-art-box"
          src={this.props.albumArtURL}
          alt="Album Art should be here"
        />
      </div>
    );
  }
}

albumArt.propTypes = {
  albumArtURL: PropTypes.string,
};
