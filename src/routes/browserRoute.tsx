import * as React from 'react';
import CardBrowser from '../components/cardBrowser';

const CardBrowserStyle: React.CSSProperties = {
	margin: 'auto',
	width: '50%',
};

export const BrowserRoute: React.StatelessComponent<any> = () => {
	return (
		<CardBrowser serverGetRoute="envsCards" style={CardBrowserStyle}/>
	);
};