import Grid from '@material-ui/core/Grid';
import * as React from 'react';
import { RouteComponentProps } from 'react-router-dom';
import CardBrowser from '../components/cardBrowser';
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
 * Splitscreen of a core on the left (attached to an environment) and a CardBrowser listing agent cards.
 * @param routeProps 
 */
export const SplitCoreAndBrowserRoute: React.StatelessComponent<RouteComponentProps<IRouteInfo>> = (routeProps: RouteComponentProps<IRouteInfo>) => {
	// TODO: Handle errors here
	const env = ModelFactory.createEnv(routeProps.match.params.envName);

	return (
		<Grid container={true} style={gridStyle}>
			<Grid item={true} xs={6} sm={6} md={6} lg={6} style={gridStyle}>
				<Core modelName={routeProps.match.params.envName} env={env} info={emptyCardInfo}/>
			</Grid>
			
			<Grid item={true} xs={6} sm={6} md={6} lg={6} style={gridStyle}>
				<CardBrowser envName={routeProps.match.params.envName} serverGetRoute="agentsCards"/>
			</Grid>
		</Grid>
	);
};