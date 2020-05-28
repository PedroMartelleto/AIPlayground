import Grid from '@material-ui/core/Grid';
import * as React from 'react';
import * as ModelFactory from '../routes/modelFactory';
import { ICardInfo, InfoCard } from './infoCard';

interface IProps {
	serverGetRoute: string;
	envName?: string;
	style?: React.CSSProperties;
}

interface IState {
	cards: ICardInfo[]; // List of environments
	isTransitioning: boolean;
}

/**
 * Displays a grid of InfoCards.
 */
export default class CardBrowser extends React.Component<IProps, IState> {
	private static sReactKey = 0;
	private static envName?: string;

	/**
	 * Turns card data into html dom elements
	 * @param card 
	 */
	private static mapCards(cardInfo: ICardInfo) {
		CardBrowser.sReactKey++;

		return (
			<Grid item={true} xs={12} sm={6} md={4} lg={4} key={"CARD_" + CardBrowser.sReactKey}>
				<InfoCard envName={CardBrowser.envName} info={cardInfo}/>
			</Grid>
		);
	}

	public state: IState = {
		cards: [],
		isTransitioning: false,
	};

	public props: IProps;

	public constructor(props: IProps) {
		super(props);
		this.props = props;
		this.fetchDBData();
	}

	public render() {
		CardBrowser.envName = this.props.envName;
		const mappedCards = this.state.cards.map(CardBrowser.mapCards);

		return (
			<div style={this.props.style}>
				<Grid container={true} spacing={8}>
					{mappedCards}
				</Grid>
			</div>
		);
	}

	private fetchDBData() {
		if (this.props.serverGetRoute === 'envsCards') {
			ModelFactory.fetchEnvsInfo(this.state.cards);
		} else {
			ModelFactory.fetchAgentsInfo(this.state.cards);
		}
	}
}