/* eslint no-console: 0 */

import errors from "../shared/errors.json";
import { translate as $t } from "./helpers";

function get(name) {
  if (typeof errors[name] !== "undefined") return errors[name];
  throw "unknown exception code!";
}

const Errors = {
  BANK_ALREADY_EXISTS: get("BANK_ALREADY_EXISTS"),
  EXPIRED_PASSWORD: get("EXPIRED_PASSWORD"),
  GENERIC_EXCEPTION: get("GENERIC_EXCEPTION"),
  INVALID_PARAMETERS: get("INVALID_PARAMETERS"),
  INVALID_PASSWORD: get("INVALID_PASSWORD"),
  NO_ACCOUNTS: get("NO_ACCOUNTS"),
  NO_PASSWORD: get("NO_PASSWORD"),
  UNKNOWN_MODULE: get("UNKNOWN_WEBOOB_MODULE")
};

export default Errors;

export function genericErrorHandler(err) {
  // Show the error in the console
  console.error(`A request has failed with the following information:
- code: ${err.code}
- short message: ${err.shortMessage}
- stack: ${err.stack || "no stack"}
- message: ${err.message}
- stringified: ${JSON.stringify(err)}
`);

  let msg;
  if (err.shortMessage) {
    msg = err.shortMessage;
  } else {
    let maybeCode = err.code ? ` (code ${err.code})` : "";
    msg = err.message + maybeCode;
  }

  if (err.code && err.code === Errors.GENERIC_EXCEPTION) {
    msg += "\n";
    msg += $t("client.sync.unknown_error");
  }

  alert(
    `${msg}\nPlease refer to the developers' console for more information.`
  );
}
