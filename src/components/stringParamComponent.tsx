// React
import * as React from 'react';
import { Typography, Grid } from '@material-ui/core';
import StringParam from 'src/rl/stringParam';

interface IProps {
    stringParam: StringParam;
    color: "primary" | "secondary";
}

/**
 * Renders a component representing a Scalar.
 */
export default class StringParamComponent extends React.Component<IProps> {
    public render() {
        return (
            <Grid container={true}>
                <Grid item={true} xs={12} sm={5}>
                    <Typography gutterBottom={true} variant="overline"> {this.props.stringParam.name} </Typography>
                </Grid>
                <Grid item={true} xs={12} sm={7}>
                    { this.getPicker() }
                </Grid>
            </Grid>
        );
    }

    private onFilePickerChange = (event) => {
        this.props.stringParam.values = [];
        this.props.stringParam.fileNames = [];

        for (const file of event.target.files) {
            const reader = new FileReader();

            reader.onload = e => {
                if (!!reader.result) {
                    this.props.stringParam.values.push(reader.result as string);
                    this.props.stringParam.fileNames.push(file.name);
                }
            };

            reader.readAsText(file, "UTF-8");
        }
    }

    /**
     * Returns the appropriate React Component to serve as a picker for the given scalar.
     */
    private getPicker() {
        const { stringParam } = this.props;

        if (stringParam.type === 'file') {
            return <input id={"F" + stringParam.name} name={"F" + stringParam.name} type="file" multiple={true} accept=".genome,.json" onChange={this.onFilePickerChange} />;
        }

        // TODO: Implement this
        return <div />;
    }
}