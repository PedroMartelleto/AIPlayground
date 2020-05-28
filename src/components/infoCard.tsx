// Material-UI
import Button from '@material-ui/core/Button';
import Card from '@material-ui/core/Card';
import CardActionArea from '@material-ui/core/CardActionArea';
import CardActions from '@material-ui/core/CardActions';
import CardContent from '@material-ui/core/CardContent';
import CardMedia from '@material-ui/core/CardMedia';
import Typography from '@material-ui/core/Typography';
// React
import * as React from 'react';
import { Link } from 'react-router-dom';

export interface ICardInfo {
	modelName: string; // 6-character string
	title: string;
	description: string;
	imgSrc: string;
}

export interface IRouteInfo {
	envName: string;
	agentName: string;
}

interface IProps {
	info: ICardInfo;
	envName?: string;
}

/**
 * Displays basic information of an Agent or an Environment (title, description, image).
 */
export class InfoCard extends React.Component<IProps> {
	public render() {
		const color = this.props.envName === undefined ? "secondary" : "primary";

		return (
			<Card>
				<CardActionArea component={this.CardLink}>
					<CardMedia
					component="img"
					style={{ objectFit: "contain" }}
					image={this.props.info.imgSrc}
					height={180}
					/>
					<CardContent>
						<Typography gutterBottom={true} variant="h5"> {this.props.info.title} </Typography>
						<Typography variant="body1"> {this.props.info.description} </Typography>
					</CardContent>
				</CardActionArea>
				<CardActions>
					<Button size="small" color={color}>Learn more</Button>
				</CardActions>
			</Card>
		);
	}

	// If envName is defined, this card is an agent card. The link route is adjusted accordingly.
	private CardLink = (props: any) => <Link to={
		this.props.envName === undefined ? '/' + this.props.info.modelName :
		'/' + this.props.envName + '/' + this.props.info.modelName
	} {...props}/>
}