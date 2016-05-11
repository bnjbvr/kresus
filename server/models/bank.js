import * as americano from 'cozydb';
import { makeLogger, promisify, promisifyModel, KError } from '../helpers';

let log = makeLogger('models/bank');

let Bank = americano.getModel('bank', {
    // Display name
    name: String,
    // Weboob module id
    uuid: String,
    // TODO customFields shouldn't be saved in memory
    customFields: x => x
});

Bank = promisifyModel(Bank);

let request = promisify(::Bank.request);

Bank.byUuid = async function byUuid(uuid) {
    if (typeof uuid !== 'string')
        log.warn('Bank.byUuid misuse: uuid must be a String');

    let params = {
        key: uuid
    };

    return await request('byUuid', params);
};

Bank.createOrUpdate = async function createOrUpdate(bank) {

    if (typeof bank !== 'object' || typeof bank.uuid !== 'string')
        log.warn('Bank.createOrUpdate misuse: bank must be a Bank instance');

    let found = await Bank.byUuid(bank.uuid);
    if (!found || !found.length) {
        log.info(`Creating bank with uuid ${bank.uuid}...`);
        return await Bank.create(bank);
    }

    if (found.length !== 1) {
        throw new KError(`More than one bank with uuid ${bank.uuid}!`);
    }

    found = found[0];
    // Will always update banks with customFields if the order of fields is
    // changed
    let customFieldsAreDifferent = bank.customFields &&
                               (typeof found.customFields === 'undefined' ||
                               JSON.stringify(found.customFields) !==
                               JSON.stringify(bank.customFields));

    if (found.uuid !== bank.uuid || found.name !== bank.name ||
        customFieldsAreDifferent) {
        log.info(`Updating attributes of bank with uuid ${bank.uuid}...`);
        await found.updateAttributes({
            uuid: bank.uuid,
            name: bank.name,
            customFields: bank.customFields });
    } else {
        log.info(`${found.name} information already up to date.`);
        return found;
    }

};

module.exports = Bank;
