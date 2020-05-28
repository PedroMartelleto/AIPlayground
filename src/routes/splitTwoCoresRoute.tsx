import Grid from '@material-ui/core/Grid';
import * as React from 'react';
import { RouteComponentProps } from 'react-router-dom';
import Core from '../components/core';
import { ICardInfo, IRouteInfo } from '../components/infoCard';
import * as ModelFactory from './modelFactory';

const emptyCardInfo: ICardInfo = {
	description: '',
	imgSrc: '',
	modelName: '',
	title: ''
};

const gridStyle = { height: '100%' };

/**
 * Splitscreen of two core views (the left one is attached to an environment and the right one is attached to an agent).
 */
export const SplitTwoCoresRoute: React.StatelessComponent<RouteComponentProps<IRouteInfo>> = (routeProps: RouteComponentProps<IRouteInfo>) => {
	// TODO: Handle errors here
	const env = ModelFactory.createEnv(routeProps.match.params.envName);
	const agent = ModelFactory.createAgent(routeProps.match.params.agentName, env!);

	return (
		<Grid container={true} style={gridStyle}>
			<Grid item={true} xs={12} sm={6} md={6} lg={6} style={gridStyle}>
				<Core modelName={routeProps.match.params.envName} env={env} info={emptyCardInfo}/>
			</Grid>
			
			<Grid item={true} xs={12} sm={6} md={6} lg={6} style={gridStyle}>
				<Core modelName={routeProps.match.params.agentName} agent={agent} info={emptyCardInfo}/>
			</Grid>
		</Grid>
	);
};