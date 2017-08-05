/**
 * Weboob API endpoints
 */
import selfapi from 'selfapi';

import * as settingsControllers from '../settings';

const weboob = selfapi({
    title: 'Weboob management'
});

const weboobActions = weboob.api('/actions');
weboobActions.post({
    title: 'Run some command on the Weboob daemon',
    handler: settingsControllers.updateWeboob,
    examples: [{
        request: {
            body: {
                action: 'update'
            }
        },
        response: {
            status: 200,
            body: {
                data: {
                    status: 'OK'
                }
            }
        }
    }]
});

export default weboob;
