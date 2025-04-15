"""Simple test file to verify demo in app.py
"""

import base64
import datetime
import os
import socket
import subprocess
import sys
import time

from cryptography.hazmat.primitives.asymmetric import ed25519
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.backends import default_backend
import jwt
import pytest
import requests


class FlaskServerManager:

    process = None
    port = None
    secret_key = None
    public_key = None

    @staticmethod
    def get_free_port():
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
    def make_keys(cls, secret_key=None):
        "Make secret and public key."

        if secret_key is None:
            secret_key = ed25519.Ed25519PrivateKey.generate()
    
        cls.secret_key = base64.b64encode(  # serialize key
            secret_key.private_bytes(
                encoding=serialization.Encoding.DER,
                format=serialization.PrivateFormat.PKCS8,
                encryption_algorithm=serialization.NoEncryption())
        ).decode('utf8')

        pk = serialization.load_der_private_key(  # de-serialization secret
            base64.b64decode(cls.secret_key), backend=default_backend(),
            password=None).public_key()
        cls.public_key = pk.public_bytes(  # serialize
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo
        ).decode('utf8')
        
    @classmethod
    def setup(cls):
        cls.teardown()  # in case process is active
        cls.make_keys()
        cls.port = cls.get_free_port()
        os.chdir(os.path.dirname(__file__))
        env = os.environ.copy()
        env['FLASK_JWT_KEY'] = cls.public_key.split('\n')[1]  # get DER piece
        env['FLASK_JWT_ALGS'] = 'EdDSA,ES256'
        cls.process = subprocess.Popen([
            'flask', 'run', '--port', str(cls.port)], env=env)
        
    @classmethod
    def make_jwt(cls, headers=None, payload=None):
        sk = serialization.load_der_private_key(  # de-serialize encoded key
            base64.b64decode(cls.secret_key), backend=default_backend(),
            password=None)
        my_jwt = jwt.encode(
            headers=headers or {'typ':'JWT', 'alg':'EdDSA'},
            payload=payload or {'sub': 'a', 'name': 'b', 'iat': 1},
            key=sk)
        return my_jwt
        

@pytest.fixture(scope="session", autouse=True)
def manage_flask_server_for_tests():
    print('\nSetup FlaskServerManager\n')
    FlaskServerManager.setup()
    time.sleep(1)  # let server get started
    yield
    print('\nTeardown FlaskServerManager\n')
    FlaskServerManager.teardown()


def test_simple_enc_dec():
    my_jwt = FlaskServerManager.make_jwt()
    req = requests.get(f'http://127.0.0.1:{FlaskServerManager.port}/hello',
                       headers={'Authorization': f'Bearer {my_jwt}'})
    assert req.status_code == 200
    assert req.text == 'Hello World!'

    bad_req = requests.get(f'http://127.0.0.1:{FlaskServerManager.port}/hello',
                       headers={'Authorization': f'Bearer {my_jwt}mybad'})
    assert bad_req.status_code == 401
    assert bad_req.text == (
        "problem=InvalidSignatureError('Signature verification failed')")


def test_premium_enc_dec():
    now = datetime.datetime.now(tz=datetime.timezone.utc).timestamp()
    my_jwt = FlaskServerManager.make_jwt(payload={
        'premium_user': 'user@example.com', 'iat': int(now)})
    req = requests.get(
        f'http://127.0.0.1:{FlaskServerManager.port}/support/urgent',
        headers={'Authorization': f'Bearer {my_jwt}'})
    assert req.status_code == 200
    assert req.text == 'processing support request for user user@example.com'


def main():
    print(f'\n\n   Running tests in {__file__}   \n\n')
    sys.exit(pytest.main([__file__, '-s', '-vvv']))

    
if __name__ == '__main__':
    main()
    
