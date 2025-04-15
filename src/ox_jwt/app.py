"""Simple Flask app to demonstrate how JWTs work.

See accompanying slides for more documentation.
"""

import base64
import datetime
from functools import wraps
import typing

from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives import serialization

import jwt
from flask import Flask, request, g, current_app


APP = Flask(__name__)             # Update config from env vars like FLASK_*
APP.config.from_prefixed_env()    # pylint: disable=no-member


def requires_jwt(func):
    """Decorator to verify that valid jwt present in header.

This decorator also puts the decoded JWT into g.decoded_jwt so
that other decorators (and general) functions can look at the
JWT info without having to redo validation.
    """
    @wraps(func)
    def decorated(*args, **kwargs):
        token = request.headers.get("Authorization", "NA ").split(" ")[1]
        # if no token return error
        try:
            key = serialization.load_der_public_key(
                base64.b64decode(current_app.config['JWT_KEY']),
                backend=default_backend())
            g.decoded_jwt = jwt.decode(
                token, algorithms=current_app.config['JWT_ALGS'].split(','),
                key=key)
            return func(*args, **kwargs)
        except Exception as problem:  # pylint: disable=broad-except
            return f'{problem=}', 401 # return 401 or other error code
    return decorated


def jwt_claims(claims_list: typing.Sequence[str]):
    "Decorator to verify jwt contains given sequence of strings."
    def make_decorator(func):
        @wraps(func)
        def decorated(*args, **kwargs):
            missing = [c for c in claims_list if not g.decoded_jwt.get(c)]
            if missing:
                return f'Missing claims: {missing}', 401
            return func(*args, **kwargs)
        return decorated
    return make_decorator


def jwt_iat(within: datetime.timedelta):
    "Decorator to check that iat in jwt is within given timedelta."
    def make_decorator(func):
        @wraps(func)
        def decorated(*args, **kwargs):
            iat = g.decoded_jwt.get('iat', None)
            if iat is None:
                return 'Missing iat', 401
            age = datetime.datetime.utcnow(
                ) - datetime.datetime.utcfromtimestamp(iat)
            if age <= within:
                return func(*args, **kwargs)
            return f'Token age {age} not within {within}', 401
        return decorated
    return make_decorator


@APP.route("/hello")
@requires_jwt
def hello():
    "Example route which just verifies jwt present (no claim checks)."
    return "Hello World!"


@APP.route('/support/urgent')
@requires_jwt
@jwt_claims(['premium_user'])
@jwt_iat(datetime.timedelta(seconds=30))
def support_urgent():
    "Example route for urgent support request (checks iat and claims)."
    return (f'processing support request for'
            f' user {g.decoded_jwt["premium_user"]}')



if __name__ == "__main__":
    APP.run(debug=False)
