#!/usr/bin/env python3
"""Encrypt the Enlaye "Details" section so the project page only shows it after the password.

Usage (from the repo root, with the plain files in enlaye/):
    pip install cryptography
    python3 tools/encrypt-enlaye.py

Encrypts the protected HTML fragment (enlaye/protected.html) and every screenshot,
video, and poster it references, writing enlaye/<file>.enc plus enlaye/key.json
(salt + iterations), then deletes the plain files so they are never published.
The page derives the same AES-256-GCM key in the browser with PBKDF2-SHA256 and
decrypts each file. protected.html is the editable source of the gated section:
edit it (and the media) here, then re-run this tool.
"""
import getpass
import json
import os
import sys
from pathlib import Path

from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC

ITERATIONS = 600_000
ENLAYE_DIR = Path(__file__).resolve().parent.parent / 'enlaye'
FILES = [
    'protected.html',
    'enlaye home.png',
    'doc management.png',
    'doc comparison.png',
    'doc preview.png',
    'project settings.mp4',
    'project-settings-poster.jpg',
    'guardian angel.mp4',
    'guardian-angel-poster.jpg',
]


def main():
    password = os.environ.get('ENLAYE_PASSWORD') or getpass.getpass('Enlaye password: ')
    if not password:
        sys.exit('No password given.')
    missing = [f for f in FILES if not (ENLAYE_DIR / f).exists()]
    if missing:
        sys.exit(f'Missing plain files in enlaye/: {", ".join(missing)}')

    salt = os.urandom(16)
    key = PBKDF2HMAC(algorithm=hashes.SHA256(), length=32, salt=salt, iterations=ITERATIONS).derive(password.encode())
    aes = AESGCM(key)
    for name in FILES:
        plain = ENLAYE_DIR / name
        iv = os.urandom(12)
        # file layout: 12-byte IV followed by ciphertext with the GCM tag appended
        (ENLAYE_DIR / f'{name}.enc').write_bytes(iv + aes.encrypt(iv, plain.read_bytes(), None))
        plain.unlink()
        print(f'encrypted {name}')
    (ENLAYE_DIR / 'key.json').write_text(json.dumps({'salt': salt.hex(), 'iterations': ITERATIONS}) + '\n')
    print('wrote enlaye/key.json')


if __name__ == '__main__':
    main()
