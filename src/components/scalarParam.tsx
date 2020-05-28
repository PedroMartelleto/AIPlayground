import Scalar from '../rl/scalar';
import ScalarSlider from './scalarSlider';

// React
import * as React from 'react';
import { Typography, Checkbox, Grid } from '@material-ui/core';

interface IProps {
    scalar: Scalar;
    color: "primary" | "secondary";
    onScalarChange: any;
}

/**
 * Renders a component representing a Scalar.
 */
export default class ScalarParam extends React.Component<IProps> {
    public render() {
        return (
            <Grid container={true}>
                <Grid item={true} xs={12} sm={5}>
                    <Typography gutterBottom={true} variant="overline"> {this.props.scalar.name} </Typography>
                </Grid>
                <Grid item={true} xs={12} sm={7}>
                    { this.getNumberPicker() }
                </Grid>
            </Grid>
        );
    }

    /**
     * Returns the appropriate React Component to serve as a picker for the given scalar.
     */
    private getNumberPicker() {
        const { color, scalar } = this.props;

        // If is checkbox...
        if (scalar.isWhole && scalar.min === 0 && scalar.max === 1) {
            return (
                // tslint:disable-next-line: jsx-no-lambda
                <Checkbox style={{ margin: 'auto' }} color={color} checked={scalar.value === 1} onChange={event => this.props.onScalarChange(event, scalar)} />
            );
        }

        // Else if is slider...
        // tslint:disable-next-line: jsx-no-lambda
        return (<ScalarSlider color={color} scalar={scalar} onChangeCommitted={event => this.props.onScalarChange(event, scalar)} />);
    }
}