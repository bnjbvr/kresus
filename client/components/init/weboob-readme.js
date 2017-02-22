import React from 'react';

import { translate as $t } from '../../helpers';

export default () => (
    <div>
        <h1>
            { $t('client.weboobinstallreadme.title') }
        </h1>
        <div className="well">
            { $t('client.weboobinstallreadme.content') }
            <a href="https://framagit.org/bnjbvr/kresus/blob/master/README.md">README</a>.
        </div>
    </div>
);
