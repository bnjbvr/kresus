// @flow
import Settings from '../../models/settings';

import * as weboob from '../../lib/sources/weboob';
import Emailer from '../../lib/emailer';
import { WEBOOB_NOT_INSTALLED } from '../../shared/errors.json';

import {
    KRequest,
    KResult,
    KError,
    asyncErr,
    setupTranslator,
    checkWeboobMinimalVersion
} from '../../helpers';

function postSave(key, value) {
    switch (key) {
        case 'email-recipient':
            Emailer.forceReinit(value);
            break;
        case 'locale':
            setupTranslator(value);
            break;
        default:
            break;
    }
}

export async function save(req: KRequest, res: KResult) {
    try {
        let userId = req.user.id;
        let pair = req.body;

        if (typeof pair.key === 'undefined') {
            throw new KError('Missing key when saving a setting', 400);
        }
        if (typeof pair.value === 'undefined') {
            throw new KError('Missing value when saving a setting', 400);
        }

        await Settings.upsert(userId, pair.key, pair.value);

        postSave(pair.key, pair.value);

        res.status(200).end();
    } catch (err) {
        return asyncErr(res, err, 'when saving a setting');
    }
}

export async function getWeboobVersion(req: KRequest, res: KResult) {
    try {
        const version = await weboob.getVersion(/* force = */ true);
        if (version <= 0) {
            throw new KError('cannot get weboob version', 500, WEBOOB_NOT_INSTALLED);
        }
        res.json({
            data: {
                version,
                isInstalled: checkWeboobMinimalVersion(version)
            }
        });
    } catch (err) {
        return asyncErr(res, err, 'when getting weboob version');
    }
}

export async function updateWeboob(req: KRequest, res: KResult) {
    try {
        await weboob.updateWeboobModules();
        res.status(200).end();
    } catch (err) {
        return asyncErr(res, err, 'when updating weboob');
    }
}

export async function testEmail(req: KRequest, res: KResult) {
    try {
        let { email } = req.body;
        if (!email) {
            throw new KError('Missing email recipient address when sending a test email', 400);
        }
        await Emailer.sendTestEmail(email);
        res.status(200).end();
    } catch (err) {
        return asyncErr(res, err, 'when trying to send an email');
    }
}
