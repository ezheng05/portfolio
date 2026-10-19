#!/usr/bin/env python3
"""Encrypt the resume files so the resume tab only shows them after the password is entered.

Usage (from the repo root, with the plain files in resume/):
    pip install cryptography
    python3 tools/encrypt-resume.py

Writes resume/<file>.enc for each PDF/WebP and resume/key.json (salt + iterations),
then deletes the plain files so they are never published. The page derives the same
AES-256-GCM key in the browser with PBKDF2-SHA256 and decrypts each file.
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
RESUME_DIR = Path(__file__).resolve().parent.parent / 'resume'
FILES = ['pm.pdf', 'pm.webp', 'robotics.pdf', 'robotics.webp', 'ml.pdf', 'ml.webp']


def main():
    password = os.environ.get('RESUME_PASSWORD') or getpass.getpass('Resume password: ')
    if not password:
        sys.exit('No password given.')
    missing = [f for f in FILES if not (RESUME_DIR / f).exists()]
    if missing:
        sys.exit(f'Missing plain files in resume/: {", ".join(missing)}')

    salt = os.urandom(16)
    key = PBKDF2HMAC(algorithm=hashes.SHA256(), length=32, salt=salt, iterations=ITERATIONS).derive(password.encode())
    aes = AESGCM(key)
    for name in FILES:
        plain = RESUME_DIR / name
        iv = os.urandom(12)
        # file layout: 12-byte IV followed by ciphertext with the GCM tag appended
        (RESUME_DIR / f'{name}.enc').write_bytes(iv + aes.encrypt(iv, plain.read_bytes(), None))
        plain.unlink()
        print(f'encrypted {name}')
    (RESUME_DIR / 'key.json').write_text(json.dumps({'salt': salt.hex(), 'iterations': ITERATIONS}) + '\n')
    print('wrote resume/key.json')


if __name__ == '__main__':
    main()
