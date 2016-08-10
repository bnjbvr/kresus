// This modules mocks output generated by weboob.
import moment from 'moment' ;

import { makeLogger, KError } from '../../helpers';
import errors from '../../shared/errors.json';

let log = makeLogger('sources/mock');

// Time needed before returning from fetchTransactions.
const TIME_TO_GENERATE_OPERATIONS_MS = 500;

// Probability of generating a random error in fetchTransactions (in %).
const PROBABILITY_RANDOM_ERROR = 10;

// Helpers.
let rand = (low, high) => low + (Math.random() * (high - low) | 0);

let randInt = (low, high) => rand(low, high) | 0;

let randomArray = arr => arr[randInt(0, arr.length)];

let randomType = () => randInt(0, 10);

// Generates a map of the accounts belonging to the given access.
let hashAccount = access => {
    let login = access.login;
    let uuid = access.bank;

    let hash = uuid.charCodeAt(0) +
               login +
               uuid.charCodeAt(3) +
               uuid.charCodeAt(uuid.length - 1);

    let map = {
        main: `${hash}1`,
        second: `${hash}2`,
        third: `${hash}3`
    };

    if (randInt(0, 100) > 80) {
        map.fourth = `${hash}4`;
    }

    return map;
};

export let SOURCE_NAME = 'mock';

export let fetchAccounts = async (access) => {

    let { main, second, third, fourth } = hashAccount(access);

    let values = [
        {
            accountNumber: main,
            label: 'Compte chèque',
            balance: Math.random() * 150,
            iban: '235711131719',
            currency: 'EUR'
        },
        {
            accountNumber: second,
            label: 'Livret A',
            balance: '500',
            currency: 'USD'
        },
        {
            accountNumber: third,
            label: 'Plan Epargne Logement',
            balance: '0'
        }
    ];

    if (fourth) {
        values.push({
            accountNumber: fourth,
            label: 'Assurance vie',
            balance: '1000'
        });
    }

    return values;
};

let randomLabels = [
    ['Café Moxka', 'Petit expresso rapido Café Moxka'],
    ['MerBnB', 'Paiement en ligne MerBNB'],
    ['Tabac Debourg', 'Bureau de tabac SARL Clopi Cloppa'],
    ['Rapide PSC', 'Paiement sans contact Rapide'],
    ['MacDollars PSC', 'Paiement sans contact Macdollars'],
    ['FNAK', 'FNAK CB blabla'],
    ['CB Sefaurat', 'Achat de parfum chez Sefaurat'],
    ['Polyprix CB', 'Courses chez Polyprix'],
    ['Croisement CB', 'Courses chez Croisement'],
    ['PRLV UJC', 'PRLV UJC'],
    ['CB Spotifaille', 'CB Spotifaille London'],
    ['Antiquaire', 'Antiquaire'],
    ['Le Perroquet Bourré', 'Le Perroquet Bourré SARL'],
    ['Le Vol de Nuit', 'Bar Le Vol De Nuit SARL'],
    ['Impots fonciers', `Prelevement impots fonciers numero reference
    47839743892 client 43278437289`],
    ['ESPA Carte Hassan Cehef', 'Paiement carte Hassan Cehef'],
    ['Indirect Energie', 'ESPA Indirect Energie SARL'],
    ['', 'VIR Mr Jean Claude Dusse'],
    ['Nuage Douillet', 'ESPA Abonnement Nuage Douillet'],
    ['Glagla Frigidaire', 'CB GLAGLA FRIGIDAIRE'],
    ['Digiticable', 'ESPA Digiticable'],
    ['NOGO Sport', 'CB NOGO Sport'],
    ['FramaHard', 'ESPA Don FramaHard'],
    ['Sergent Tchoutchou', 'CB online Sergent Tchoutchou'],
    ['RAeTP', 'CB Raleurs Ambulants et Traficoteurs Patentés']
];

let randomLabelsPositive = [
    ['VIR Nuage Douillet', 'VIR Nuage Douillet REFERENCE Salaire'],
    ['Impots', 'Remboursement impots en votre faveur'],
    ['', 'VIR Pots de vin et magouilles pas claires'],
    ['Case départ', 'Passage par la case depart'],
    ['Assurancetourix', 'Remboursement frais médicaux pour plâtre généralisé']
];

let generateDate = (lowDay, highDay, lowMonth, highMonth) =>
    moment().month(rand(lowMonth, highMonth))
            .date(rand(lowDay, highDay))
            .format('YYYY-MM-DDT00:00:00.000[Z]');

let generateOne = account => {

    let n = rand(0, 100);
    let now = moment();
    let type = randomType();

    // with a 2% rate, generate a special operation to test duplicates
    // (happening on 4th of current month).
    if (n < 2) {
        return {
            account,
            amount: '-300',
            title: 'Loyer',
            raw: 'Loyer habitation',
            date: generateDate(4, 4, now.month(), now.month()),
            type
        };
    }

    // Note: now.month starts from 0.
    let date = generateDate(1, now.date(), 0, now.month() + 1);

    if (n < 15) {
        let [title, raw] = randomArray(randomLabelsPositive);
        let amount = (rand(100, 800) + rand(0, 100) / 100).toString();

        return {
            account,
            amount,
            title,
            raw,
            date,
            type
        };
    }

    let [title, raw] = randomArray(randomLabels);
    let amount = (-rand(0, 60) + rand(0, 100) / 100).toString();

    let binary = null;
    if (rand(0, 100) > 90) {
        log.info('Generating a binary attached to the operation.');
        binary = {
            fileName: '__dev_example_file'
        };
    }

    return {
        account,
        amount,
        title,
        raw,
        date,
        type,
        binary
    };
};

let generateRandomError = () => {
    let errorTable = [];
    for (let error of Object.keys(errors)) {
        errorTable.push(errors[error]);
    }
    return errorTable[randInt(0, errorTable.length - 1)];
};

let selectRandomAccount = access => {

    let n = rand(0, 100);
    let accounts = hashAccount(access);

    if (n < 90)
        return accounts.main;

    if (n < 95)
        return accounts.second;

    return accounts.third;
};

let generate = access => {
    let operations = [];

    let i = 5;
    while (i--) {
        operations.push(generateOne(selectRandomAccount(access)));
    }

    while (rand(0, 100) > 70 && i < 3) {
        operations.push(generateOne(selectRandomAccount(access)));
        i++;
    }

    // Generate exact same operations imported at the same time
    // These operations shall not be considered as duplicates.
    if (rand(0, 100) > 85 && operations.length) {
        log.info('Generate a similar but non-duplicate operation.');
        operations.push(operations[0]);
    }

    // Generate always the same operation, so that it is considered
    // as a duplicate.
    if (rand(0, 100) > 70) {
        log.info('Generate a possibly duplicate operation.');

        let duplicateOperation = {
            title: 'This is a duplicate operation',
            amount: '13.37',
            raw: 'This is a duplicate operation',
            account: hashAccount(access).main
        };

        // The date is one day off, so it is considered a duplicate by the client.
        let date = moment(new Date('05/04/2020'));
        if (rand(0, 100) <= 50) {
            date = date.add(1, 'days');
        }

        duplicateOperation.date = date.format('YYYY-MM-DDT00:00:00.000[Z]');
        operations.push(duplicateOperation);
    }

    // Sometimes generate a very old operation, probably older than the oldest one.
    if (rand(0, 100) > 90) {
        log.info('Generate a very old transaction to trigger balance resync.');
        let op = {
            title: 'Ye Olde Transaction',
            raw: 'Ye Olde Transaction - for #413 testing',
            amount: '42.12',
            account: hashAccount(access).main,
            date: new Date('01/01/2000')
        };
        operations.push(op);
    }

    log.info(`Generated ${operations.length} fake operations:`);
    let accountMap = new Map;
    for (let op of operations) {
        let prev = accountMap.has(op.account) ? accountMap.get(op.account) : [0, 0];
        accountMap.set(op.account, [prev[0] + 1, prev[1] + +op.amount]);
    }
    for (let [account, [num, amount]] of accountMap) {
        log.info(`- ${num} new operations (${amount}) for account ${account}.`);
    }

    return operations;
};

export let fetchTransactions = access => {
    return new Promise((accept, reject) => {
        setTimeout(() => {

            if (rand(0, 100) <= PROBABILITY_RANDOM_ERROR) {
                let errorCode = generateRandomError();
                let error = new KError(`New random error: ${errorCode}`, 500, errorCode);
                reject(error);
                return;
            }

            accept(generate(access));
        }, TIME_TO_GENERATE_OPERATIONS_MS);
    });
};
