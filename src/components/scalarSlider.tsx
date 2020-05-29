import Scalar from "src/rl/scalar";

// React
import * as React from 'react';
import Slider from '@material-ui/core/Slider';
import { Typography, Grid, TextField } from '@material-ui/core';

interface IProps {
    scalar: Scalar;
    color: "primary" | "secondary";
    onChangeCommitted: any;
}

interface IState {
    value: number;
    input: string;
}

export default class ScalarSlider extends React.Component<IProps, IState> {
    private static styleTextField: React.CSSProperties = { fontSize: 12, textAlign: 'center', paddingBottom: 0 };

    private static stringToFloatInRange(str: string, min: number, max: number) : number | undefined {
        if (str.length <= 0) {
            return undefined;
        }
        
        const value = Number(str);

        if (!Number.isFinite(value) || value < min || value > max) {
            return undefined;
        }

        return value;
    }

    /**
     * Returns a 4 digit-rounded string of the given float.
     * Helper function called during render.
     * @param f 
     */
    private static floatToString(f: number) {
        return String(Math.round(f * 1000) / 1000.0);
    }

    constructor(props) {
        super(props);
       this.state = { value: this.props.scalar.value, input: String(this.props.scalar.value) };
    }

    public render() {
        let min = this.props.scalar.min;
        let max = this.props.scalar.max;
        let step = (max - min) / 10000;

        if (this.props.scalar.isWhole) {
            min = Math.ceil(min);
            max = Math.floor(max);
            step = 1;
        }

        return (
            <Grid container={true} spacing={0} color={this.props.color}>
                <Grid item={true} xs={3}>
                    <Typography variant="overline" align="left">{ScalarSlider.floatToString(min)}</Typography>
                </Grid>

                <Grid item={true} xs={2}/>

                <Grid item={true} xs={2}>
                    <TextField onBlur={this.handleBlurTextField} onChange={this.handleChangeTextField} inputProps={{ style: ScalarSlider.styleTextField }} multiline={false} color={this.props.color} variant="standard" value={this.state.input}/>
                </Grid>

                <Grid item={true} xs={2}/>

                <Grid item={true} xs={3}>
                    <Typography variant="overline" align="right">{ScalarSlider.floatToString(max)}</Typography>
                </Grid>
                
                <Grid item={true} xs={12}>
                    <Slider step={step} min={min} max={max} value={this.state.value}
                        onChange={this.handleChangeSlider}
                        onChangeCommitted={this.handleChangeComittedSlider}
                    />
                </Grid>
            </Grid>
        );
    }

    private handleChangeComittedSlider = (event: any, value: any) => {
        this.props.onChangeCommitted(value);
    }

    // Called when the text field loses focus
    private handleBlurTextField = (event: any) => {
        let value = Number(event.target.value);

        // If the text is a valid number, we clamp it and set it as our new slider value
        if (Number.isFinite(value)) {
            const rounded = Math.round(value * 1000)/1000.0;
            value = Math.min(Math.max(rounded, this.props.scalar.min), this.props.scalar.max);
            this.setState({ value, input: String(value) });
        } else {
            // Otherwise we set the text to our last value
            this.setState({ value: this.state.value, input: String(this.state.value) });
        }
    }

    // Called when the text field is edited
    private handleChangeTextField = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        // Converts the new string value of the text field to a number
        const value = ScalarSlider.stringToFloatInRange(event.target.value, this.props.scalar.min, this.props.scalar.max);
        
        // Updates the state if the text input is a valid number
        if (value !== undefined) {
            this.setState({ value, input: event.target.value });
        } else {
            this.setState({ input: event.target.value });
        }
    }

    // Called when the slider is changed
    private handleChangeSlider = (event: any, value: number | number[]) => {
        let val: number = 0;
        
        if (Array.isArray(value)) {
            val = value[0];
        } else {
            val = value;
        }

        // Updates both the text and the slider
        this.setState({ value: val, input: ScalarSlider.floatToString(val) });
    }
}