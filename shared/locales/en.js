module.exports = {

    client: {

        KRESUS: 'KRESUS',

        accountwizard: {
            title: 'Welcome!',
            content: "Kresus is a personal finance manager that allows you to have a better understanding of what your main expenses are, by computing useful statistics about your bank transactions. To start, please set up a bank account below:",
            import_title: "Import",
            import: "If you've exported your previous Kresus instance, you can also import it back now by selecting the JSON file created on export.",
            advanced: "Advanced options",
        },

        amount_well: {
            current_search: 'For this search',
            this_month: 'This month',
        },

        category: {
            none: 'None',
            add: 'add a category',
            column_category_color: 'COLOR',
            column_category_name: 'CATEGORY NAME',
            column_action: 'ACTION',
            dont_replace: "Don't replace",
            erase: `This will erase the "%{title}" category. If there are transactions mapped to this category, and you would like to move them to an existing category, you can do so in this list (by default, all transactions will move to the "None" category). Are you sure about this?`,
            title: 'Categories',
            label: 'Label'
        },

        editaccessmodal: {
            not_empty: "Please fill the password field",
            customFields_not_empty: "Please fill all the custom fields",
            title: "Edit bank access",
            body: "If your bank password changed, you need to update it in Kresus so that the bank link keeps on syncing operations from your bank account.",
            cancel: "Cancel",
            save: "Save",
        },

        confirmdeletemodal: {
            title: 'Confirm deletion',
            confirm: 'Confirm deletion',
            dont_delete: "Don't delete",
        },

        charts: {
            Amount: 'Amounts',
            balance: 'balance',
            by_category: 'by category',
            differences_all: 'differences',
            Paid: 'Paid',
            Received: 'Received',
            Saved: 'Saved',
            title: 'Charts',

            type: 'Type',
            all_types: 'All types',
            positive: 'Income',
            negative: 'Expenses',

            period: 'Period',
            all_periods: 'All times',
            current_month: 'Current month',
            last_month: 'Last month',
            three_months: 'Last three months',
            six_months: 'Last six months',

            unselect_all_categories: 'Unselect all categories',
            select_all_categories: 'Select all categories'
        },

        general: {
            cancel: 'cancel',
            delete: 'delete',
            edit: 'edit',
            save: 'save',
        },

        display_options: {
            title:"Display settings",
            future_operations: "Display pending operations"
        },

        loadscreen: {
            title: "Please wait while Kresus installs dependencies…",
            prolix1: "Kresus is currently trying to install its dependencies.  This can take up to 10 minutes on slow servers.",
            prolix2: "If you're self-hosting, please consider reading the",
            prolix3: "to ensure all the needed prerequisites have been installed on your machine. On the CozyCloud infra, your machine should be already set up.",
            prolix4: "The page is going to automatically reload in a short while. If you get stuck after 10 minutes, consider writing a message in the",
            prolix5: "Thank you for your patience."
        },

        menu: {
            banks: 'Banks',
            categories: 'Categories',
            charts: 'Charts',
            settings: 'Settings',
            similarities: 'Duplicates',
            sublists: 'Accounts',
            reports: 'Reports',
        },

        operations: {
            amount: 'Amount:',

            column_date: 'Date',
            column_name: 'Transaction',
            column_amount: 'Amount',
            column_category: 'Category',
            column_type: 'Type',

            current_balance: 'Balance',
            as_of: 'as of',
            received: 'Received',
            paid: 'Paid',
            saved: 'Saved',

            attached_file: 'Download the attached file',
            edf_details: 'See the bill in the EDF application',

            full_label: 'Full label:',
            category: 'Category:',

            last_sync: 'Last sync:',
            sync_now: 'Synchroniser maintenant',
            syncing: 'Fetching your latest bank transactions…',

            title: 'Transactions',
            type: 'Type:',
            custom_label: 'Custom label',
            add_custom_label: 'Add a custom label',
            future_operation: 'Pending operation'
        },

        search: {
            any_category: "Any category",
            any_type: "Any type",
            keywords: "Keywords:",
            category: 'Category:',
            type: 'Type:',
            amount_low: 'Amount: between',
            and: 'and',
            date_low: 'Date: between',
            clear: 'Clear',
            clearAndClose: 'Clear and close',
            title: 'Search',
        },

        settings: {
            column_account_name: 'Name',
            unknown_field_type: 'unknown field type',
            website: 'Website',
            auth_type: "Authentification type",
            birthday: "Birthday",
            birthdate: "Birthday",
            merchant_id: "Merchant ID",
            birthday_placeholder: "DDMMYYYY",
            secret: "Secret",
            secret_placeholder: "Enter your secret phrase here",
            favorite_code_editor: "Favorite code editor",
            challengeanswer1: "Challenge Answer 1",
            question1: "Question 1",
            question2: "Question 2",
            question3: "Question 3",
            answer1: "Answer 1",
            answer2: "Answer 2",
            answer3: "Answer 3",
            bank: 'Bank',
            login: 'Login',
            password: 'Password',
            new_bank_form_title: 'Configure a new bank access',
            duplicate_threshold: 'Duplication threshold',
            duplicate_help: 'Two transactions will appear in the Duplicates section if they both happen within this period of time (in hours) of each other.',

            weboob_auto_update: "Automatically update Weboob modules",
            weboob_auto_merge_accounts: "Automatically merge Weboob accounts",

            reinstall_weboob: 'Reinstall weboob',
            go_reinstall_weboob: "Fire the reinstall!",
            reinstall_weboob_help: "This will entirely reinstall Weboob. Note it can take up to a few minutes, during which you won't be able to poll your accounts and operations. Use with caution!",

            update_weboob: 'Update weboob',
            go_update_weboob: "Fire the update!",
            update_weboob_help: "This will update Weboob without reinstalling it from scratch.  This should be done as a first step, in case fetching transactions doesn't work anymore.",

            export_instance: "Export Kresus instance",
            go_export_instance: "Export",
            export_instance_help: "This will export the instance to a JSON format that another Kresus instance can import. This won't contain the passwords of your bank accesses, which need to be reset manually when importing data from another instance.",

            import_instance: "Import Kresus instance",
            go_import_instance: "Import",
            import_instance_help: "This will import an existing instance, exported with the above button. It won't try to merge any data, so please ensure that your data is clean and delete any existing data with the DataBrowser, if needed.",

            title: 'Settings',

            tab_accounts: 'Bank accounts',
            tab_about: 'About',
            tab_backup: 'Backup / restore data',
            tab_defaults: 'Default parameters',
            tab_emails: 'Emails',
            tab_weboob: 'Weboob management',

            erase_account: `This will erase the "%{title}" account, and all its transactions. If this is the last account bound to this bank, the bank will be erased as well. Are you sure about this?`,
            erase_bank: `This will erase the "%{name}" bank, and all its associated accounts and transactions. Are you sure about this?`,
            missing_login_or_password: "Missing login or password",
            submit: 'Submit',

            delete_account_button: "Delete account",
            delete_bank_button: "Delete bank",
            reload_accounts_button: "Reload accounts",
            change_password_button: "Edit bank access",
            add_bank_button: "Add a new bank access",
            set_default_account: "Set as default account",
            add_operation: "Add an operation",

            emails: {
                invalid_limit: "Limit value is invalid",
                add_balance: "Add a new balance notification",
                add_transaction: "Add a new transaction notification",
                add_report: "Add a new email report",
                account: "Account",
                create: "Create",
                cancel: "Cancel",
                details: "Details",
                balance_title: "Balance alerts",
                transaction_title: "Transaction alerts",
                reports_title: "Reports",
                send_if_balance_is: "Notify me if balance is",
                send_if_transaction_is: "Notify me if a transaction's amount is",
                send_report: "Send me a report with the following frequency:",
                greater_than: "greater than",
                less_than: "less than",
                delete_alert: "Delete alert",
                delete_report: "Delete report",
                delete_alert_full_text: "This will erase this alert and you won't receive emails and notifications about it anymore. Are you sure you want to remove this alert?",
                delete_report_full_text: "This will erase this report and you won't receive emails about it anymore.  Are you sure you want to remove this alert?",
                daily: "daily",
                weekly: "weekly",
                monthly: "monthly",
            },

            default_chart_type: "Chart: default amount type",
            default_chart_period: "Chart: default period",
        },

        similarity: {
            nothing_found: "No similar transactions found.",
            title: "Duplicates",
            help: "Sometimes, importing bank transactions may lead to duplicate transactions, e.g. if the bank added information to a given transaction a few days after its effective date. This screen shows similarities between suspected transactions, and allows you to manually remove duplicates. Note: Categories may be transferred upon deletion: if you have a pair of duplicates A/B, in which A has a category but B doesn't, and you choose to delete A, then B will inherit A's category.",
            date: "Date",
            label: "Label",
            amount: "Amount",
            category: "Category",
            imported_on: "Imported on",
            merge: "Merge",
            type: "Type",
        },

        sync: {
            no_password: "This access' password isn't set. Please set it in your bank settings and retry.",
            wrong_password: 'Your password appears to be rejected by the bank website, please go to your Kresus settings and update it.',
            first_time_wrong_password: 'The password seems to be incorrect, please type it again.',
            invalid_parameters: "The format of one of your login or password might be incorrect: %{content}",
            expired_password: 'Your password has expired. Please change it on your bank website and update it in Kresus.',
            unknown_module: 'Unknown bank module. Please try updating Weboob.',
            unknown_error: "Unknown error, please report: %{content}",
        },

        type: {
            none: "None",
            unknown: "Unknown",
            transfer: "Transfer",
            order: "Order",
            check: "Check",
            deposit: "Deposit",
            payback: "Payback",
            withdrawal: "Withdrawal",
            card: "Card",
            loan_payment: "Loan payment",
            bankfee: "Bank fee",
            cash_deposit: "Cash deposit",
        },

        addoperationmodal: {
            label: "Title",
            amount: "Amount",
            category: "Category",
            cancel: "Cancel",
            submit: "Create",
            add_operation: "Create an operation for the account %{account}",
            type: "Type",
            date: "Date",
            description: "You're about to create an operation for account %{account}. Make sure your account is synced before creating it. In case you want to delete an operation which was created by mistake, please use the databrowser app."
        }
    },

    server: {

    }
}
