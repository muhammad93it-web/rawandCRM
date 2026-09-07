# Area modules (PHP mirror)

Each file `<area>.php` defines `function <area>_dispatch(string $method, string $path): bool` and ends with
`$GLOBALS['rawand_modules'][] = '<area>_dispatch';`. Return `true` only after you have sent a response
(`json_response`/`error_response` exit the script anyway); return `false` if the path is not yours.
Modules run after `auth_authorize_api_request()` and before the legacy handlers and `generic_dispatch()`.
Use the helpers from bootstrap.php (`db()`, `json_response`, `error_response`, `json_body`, `required_string`, `number_value`, `integer_value`, `iso_timestamp`) and `auth_require()` (returns the current user row or 401).
