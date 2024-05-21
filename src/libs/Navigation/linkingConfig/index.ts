/* eslint-disable @typescript-eslint/naming-convention */
import type {LinkingOptions} from '@react-navigation/native';
import type {RootStackParamList} from '@navigation/types';
import config from './config';
import customGetPathFromState from './customGetPathFromState';
import getAdaptedStateFromPath from './getAdaptedStateFromPath';
import prefixes from './prefixes';
import subscribe from './subscribe';

const linkingConfig: LinkingOptions<RootStackParamList> = {
    getStateFromPath: (...args) => {
        const {adaptedState} = getAdaptedStateFromPath(...args);

        // ResultState | undefined is the type this function expect.
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        // console.log('adapted state', JSON.stringify(adaptedState, null, 2));
        return adaptedState;
    },
    subscribe,
    getPathFromState: customGetPathFromState,
    prefixes,
    config,
};

export default linkingConfig;
