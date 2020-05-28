import Scalar from '../rl/scalar';

// React
import * as React from 'react';
import { Divider, Typography, Paper } from '@material-ui/core';
import ScalarParam from './scalarParam';
import Button from '@material-ui/core/Button';
import update from "immutability-helper";
import AgentModel from '../rl/agents/agentModel';
import EnvironmentModel from '../rl/envs/environmentModel';
import StringParam from 'src/rl/stringParam';
import StringParamComponent from './stringParamComponent';

interface IProps {
    scalars: Scalar[];
    stringParams?: StringParam[];
    tint: "primary" | "secondary";
    agent: AgentModel | undefined;
    env: EnvironmentModel | undefined;
}

interface IState {
    families: IScalarFamily[];
    stringFamilies: IStringFamily[];
}

/**
 * Group of scalars which share the same family name.
 */
interface IScalarFamily {
    scalars: Scalar[];
}

/**
 * Group of string params which share the same family name.
 */
interface IStringFamily {
    stringParams: StringParam[];
}

/**
 * Renders a scalar array. Separates scalars in groups named after each scalar family.
 */
export default class ParamsFamily extends React.Component<IProps, IState> {
    private static styleDiv = { paddingTop: 5, marginLeft: 7, marginRight: 7 };
    private static styleTypography = { marginTop: 2, marginBottom: 6 };
    private static styleDivider = { marginTop: 4, marginBottom: 4 };
    private static stylePaper = { marginLeft: "1.5%", marginRight: "1.5%", marginTop: 5 };

    private static sReactKey: number = 0;

    // We use static variables to allow communication between IProps and our static mapping functions
    private static sTint: "primary" | "secondary";

    public componentWillMount() {
        const families: IScalarFamily[] = [];

        // Separates the scalar array from props by families and stores them in the state.

        for (const scalar of this.props.scalars) {
            let family: (IScalarFamily | undefined); // Inits to undefined

            // Tries to find family by iterating through the families already added to the state.

            for (const fam of families) {
                if (fam.scalars[0].familyName === scalar.familyName) {
                    family = fam;
                }
            }

            // If not found, we create a family for the scalar.
            if (family === undefined) {
                families.push({ scalars: [scalar] });
            } else {
                // Otherwise, we push to an existing family.
                family.scalars.push(scalar);
            }
        }

        // Does the same thing for string params.

        const stringFamilies: IStringFamily[] = [];

        // Separates the scalar array from props by families and stores them in the state.

        if (!!this.props.stringParams) {
            for (const stringParam of this.props.stringParams) {
                let family: (IStringFamily | undefined); // Inits to undefined

                // Tries to find family by iterating through the string families already added to the state.

                for (const fam of stringFamilies) {
                    if (fam.stringParams[0].familyName === stringParam.familyName) {
                        family = fam;
                    }
                }

                // If not found, we create a family for the scalar.
                if (family === undefined) {
                    stringFamilies.push({ stringParams: [ stringParam ] });
                } else {
                    // Otherwise, we push to an existing family.
                    family.stringParams.push(stringParam);
                }
            }
        }

        this.setState({ families, stringFamilies });
    }

    public render() {
        ParamsFamily.sTint = this.props.tint;

        const mappedScalarCards = this.state.families.map(this.mapFamiliesToCards);
        const mappedStringCards = this.state.stringFamilies.map(this.mapStringParamsToCards);

        return (
            <Paper style={ParamsFamily.stylePaper}>
                <Button onMouseDown={this.onRefreshAction} size="small" color={ParamsFamily.sTint}>Refresh</Button>
                { mappedScalarCards }
                { mappedStringCards }
            </Paper>
        );
    }

    private onScalarChange = (event: any, scalar: Scalar) => {
        if (!!event.target) {
            const newValue = event.target.checked;
            this.updateStateForScalar(scalar, newValue ? 1 : 0);
        } else {
            const newValue = event;
            this.updateStateForScalar(scalar, newValue);
        }
    }

    private updateStateForScalar = (scalar: Scalar, newValue: number) => {
        let familyIndex = 0;
        let scalarIndex = 0;

        for (const family of this.state.families) {
            if (family.scalars[0].familyName === scalar.familyName) {
                break;
            }

            familyIndex += 1;
        }

        for (const stateScalar of this.state.families[familyIndex].scalars) {
            if (stateScalar.name === scalar.name) {
                break;
            }

            scalarIndex += 1;
        }

        this.setState({ families:
            update(this.state.families, {
                [familyIndex]: { scalars: {
                    [scalarIndex]: { $merge: {
                        value: newValue
                    }}
                }}
            })
        });
    }

    private mapScalarToComponent = (scalar: Scalar) => {
        ParamsFamily.sReactKey++;

        return (
            <ScalarParam onScalarChange={this.onScalarChange} key={ParamsFamily.sReactKey} scalar={scalar} color={ParamsFamily.sTint}/>
        );
    }

    private mapStringParamToComponent = (stringParam: StringParam) => {
        ParamsFamily.sReactKey++;

        return (
            <StringParamComponent key={ParamsFamily.sReactKey} color={ParamsFamily.sTint} stringParam={stringParam} />
        );
    }

    /**
     * Creates a Material UI Card to hold this family data.
     */
    private mapFamiliesToCards = (family: IScalarFamily) => {
        ParamsFamily.sReactKey++;

        const cardParams = family.scalars.map(this.mapScalarToComponent);

        const tint = ParamsFamily.sTint;

        return (
            <div key={ParamsFamily.sReactKey} style={ParamsFamily.styleDiv}>
                <Typography color={tint} variant="h6" style={ParamsFamily.styleTypography}>{ family.scalars[0].familyName }</Typography>
                { cardParams }
                <Divider style={ParamsFamily.styleDivider}/>
            </div>
		);
    }

    /**
     * Creates a Material UI Card to hold this family data.
     */
    private mapStringParamsToCards = (family: IStringFamily) => {
        ParamsFamily.sReactKey++;

        const cardParams = family.stringParams.map(this.mapStringParamToComponent);

        const tint = ParamsFamily.sTint;

        return (
            <div key={ParamsFamily.sReactKey} style={ParamsFamily.styleDiv}>
                <Typography color={tint} variant="h6" style={ParamsFamily.styleTypography}>{ family.stringParams[0].familyName }</Typography>
                { cardParams }
                <Divider style={ParamsFamily.styleDivider}/>
            </div>
		);
    }

    /**
     * Refreshes the current environment/agent.
     * @param event 
     */
    private onRefreshAction = (event: any) => {
		const newParamsArray = new Array<Scalar>();

		for (const family of this.state.families) {
			newParamsArray.push(...family.scalars);
		}

		if (this.props.agent) {
            this.props.agent.reset(newParamsArray);
            this.props.agent.env.resetState();
		} else if (this.props.env) {			
			this.props.env!.reset(newParamsArray);
		}
	}
}