import React from 'react';

export default class Seekbar extends React.Component {
	/*constructor(props) {
		super();
		
		this.state = {
			seekVal: 0
		}
	}*/
	render() {
		return(
			<div className="seekbar base-div">
				<div>{this.props.currentTime}</div>
				<input 
					type="range" 
					value={this.props.sliderCurrent}
					onChange={this.props.onChange}
					onMouseUp={this.props.onSliderChange}/>
				<div>{this.props.totalTime}</div>
			</div>
		)
	}
}