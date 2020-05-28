import * as React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { AppRoutes } from './routes/appRoutes';

class App extends React.Component {
	private static styleAppRoutes = { height: '100%' };

	public render() {
		return (
			<Router>
				<AppRoutes style={App.styleAppRoutes}/>
			</Router>
		);
	}
}

export default App;
