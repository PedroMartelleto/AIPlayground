import * as React from 'react';
import { Route, Switch } from 'react-router-dom';
import { BrowserRoute } from './browserRoute';
import { SplitCoreAndBrowserRoute } from './splitCoreAndBrowserRoute';
import { SplitTwoCoresRoute } from './splitTwoCoresRoute';

const routeStyle = { height: '100%' };

export const AppRoutes: React.StatelessComponent<any> = () => {
	return (
		<Switch>
			<Route path="/:envName/:agentName" component={SplitTwoCoresRoute} style={routeStyle}/>
			<Route path="/:envName" component={SplitCoreAndBrowserRoute} style={routeStyle}/>
			<Route path="/" component={BrowserRoute} style={routeStyle}/>
		</Switch>
	);
};