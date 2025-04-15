"""Simple test file to verify demo in app.py
"""

import base64
import datetime
import os
import socket
import subprocess
import sys
import time
import typing

from cryptography.hazmat.primitives.asymmetric import ed25519
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.backends import default_backend
import jwt
import pytest
import requests


class FlaskServerManager:
    """Class to manage flask server.
    """

    process = None
    port = None
    secret_key = None
    public_key = None

    @staticmethod
    def get_free_port() -> int:
        "Finds and returns an available port on the system."
        sock = socket.socket()
        sock.bind(('', 0))
        port = sock.getsockname()[1]
        sock.close()
        return port

    @classmethod
    def teardown(cls):
        "Tear down subprocess for server."

        if cls.process is not None:
            cls.process.kill()
        cls.process = None

    @classmethod
    def setup(cls):
        """Setup server (and keys) and run in subprocess
        """
        cls.teardown()  # in case process is active
        cls.secret_key, cls.public_key = make_keys()
        cls.port = cls.get_free_port()
        os.chdir(os.path.dirname(__file__))
        env = os.environ.copy()
        env['FLASK_JWT_KEY'] = cls.public_key.split('\n')[1]  # get DER piece
        env['FLASK_JWT_ALGS'] = 'EdDSA,ES256'
        cls.process = subprocess.Popen([  # pylint: disable=consider-using-with
            'flask', 'run', '--port', str(cls.port)], env=env)


def make_keys(secret_key=None):
    "Make secret and public key."

    if secret_key is None:
        secret_key = ed25519.Ed25519PrivateKey.generate()

    serialized_secret_key = base64.b64encode(  # serialize key
        secret_key.private_bytes(
            encoding=serialization.Encoding.DER,
            format=serialization.PrivateFormat.PKCS8,
            encryption_algorithm=serialization.NoEncryption())
    ).decode('utf8')

    public_key = secret_key.public_key()

    serialized_public_key = public_key.public_bytes(  # serialize
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo
    ).decode('utf8')

    return serialized_secret_key, serialized_public_key


def make_jwt(secret_key: str, headers: typing.Optional[dict] = None,
             payload: typing.Optional[dict] = None) -> str:
    """Create JWT.

    :param secret_key:   String represening serialized secret key.

    :param headers=None:   Optional dictionary of headers for JWT.

    :param payload=None:   Optional dictionary for payload of JWT.

    ~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-

    :return:  Encoded JWT.

    ~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-

    PURPOSE:  Create JWT from secret key, headers, and payload.

    """
    sk = serialization.load_der_private_key(  # de-serialize encoded key
        base64.b64decode(secret_key), backend=default_backend(),
        password=None)
    my_jwt = jwt.encode(
        headers=headers or {'typ': 'JWT', 'alg': 'EdDSA'},
        payload=payload or {'sub': 'a', 'name': 'b', 'iat': 1},
        key=sk)
    return my_jwt


@pytest.fixture(scope="session", autouse=True)
def manage_flask_server_for_tests():
    "Pytest fixture to setup/teardown flask server for tests."

    print('\nSetup FlaskServerManager\n')
    FlaskServerManager.setup()
    time.sleep(1)  # let server get started
    yield
    print('\nTeardown FlaskServerManager\n')
    FlaskServerManager.teardown()


def test_simple_enc_dec():
    """Simple test of encoding/decoding.
    """
    my_jwt = make_jwt(FlaskServerManager.secret_key)
    req = requests.get(f'http://127.0.0.1:{FlaskServerManager.port}/hello',
                       headers={'Authorization': f'Bearer {my_jwt}'},
                       timeout=30)
    assert req.status_code == 200
    assert req.text == 'Hello World!'

    bad_req = requests.get(f'http://127.0.0.1:{FlaskServerManager.port}/hello',
                           headers={'Authorization': f'Bearer {my_jwt}mybad'},
                           timeout=30)
    assert bad_req.status_code == 401
    assert bad_req.text == (
        "problem=InvalidSignatureError('Signature verification failed')")


def test_premium_enc_dec():
    """Test encoding/decoding with claims for premium user.
    """
    now = datetime.datetime.now(tz=datetime.timezone.utc).timestamp()
    my_jwt = make_jwt(FlaskServerManager.secret_key, payload={
        'premium_user': 'user@example.com', 'iat': int(now)})
    req = requests.get(
        f'http://127.0.0.1:{FlaskServerManager.port}/support/urgent',
        headers={'Authorization': f'Bearer {my_jwt}'}, timeout=30)
    assert req.status_code == 200
    assert req.text == 'processing support request for user user@example.com'


def main():
    "Run tests if module is run as main command."

    print(f'\n\n   Running tests in {__file__}   \n\n')
    sys.exit(pytest.main([__file__, '-s', '-vvv']))


if __name__ == '__main__':
    main()
