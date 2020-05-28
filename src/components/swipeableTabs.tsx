import AppBar from "@material-ui/core/AppBar";
import Tab from "@material-ui/core/Tab";
import Tabs from "@material-ui/core/Tabs";
import * as React from "react";
import SwipeableViews from "react-swipeable-views";

interface IProps {
	tab1: object;
	tab2: object;
	tab1Name: string;
	tab2Name: string;
	color: "primary" | "secondary";
}

interface IState {
	value: number;
}

/**
 * Component made of an AppBar which controls two SwipeableViews under it.
 */
export default class SwipeableTabs extends React.Component<IProps, IState> {
	private static styleDiv = { height: '100%' };

	public state: IState = {
		value: 0
	};

	public handleChange = (event: any, value: number) => {
		this.setState({ value });
	}

	public handleChangeIndex = (index: number) => {
		this.setState({ value: index });
	}

	public render() {
		return (
			<div style={SwipeableTabs.styleDiv}>
				<AppBar position="static" color="default">
					<Tabs
						value={this.state.value}
						onChange={this.handleChange}
						indicatorColor={this.props.color}
						textColor={this.props.color}
						variant="fullWidth"
					>
						<Tab label={this.props.tab1Name}/>
						<Tab label={this.props.tab2Name}/>
					</Tabs>
				</AppBar>
				<SwipeableViews
					index={this.state.value}
					onChangeIndex={this.handleChangeIndex}
					style={SwipeableTabs.styleDiv} // This view uses the same style as the div
				>
					{this.props.tab1}
					{this.props.tab2}
				</SwipeableViews>
			</div>
		);
	}
}
