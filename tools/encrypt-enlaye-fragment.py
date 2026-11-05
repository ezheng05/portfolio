#!/usr/bin/env python3
"""Encrypt one extra file for the Enlaye page with the existing password, without touching the others.

Usage (from the repo root, with the plain file in enlaye/):
    pip install cryptography
    python3 tools/encrypt-enlaye-fragment.py early.html

Reads the salt and iteration count from enlaye/key.json (written by encrypt-enlaye.py), so the
current Enlaye password unlocks the new file too. Writes enlaye/<file>.enc, then deletes the plain
file so it is never published. The page loads enlaye/early.html.enc above the protected details
when it exists.
"""
import getpass
import json
import os
import sys
from pathlib import Path

from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC

ENLAYE_DIR = Path(__file__).resolve().parent.parent / 'enlaye'


def main():
    if len(sys.argv) != 2:
        sys.exit('Usage: python3 tools/encrypt-enlaye-fragment.py <file in enlaye/>')
    plain = ENLAYE_DIR / sys.argv[1]
    if not plain.exists():
        sys.exit(f'Missing {plain}')
    meta = json.loads((ENLAYE_DIR / 'key.json').read_text())
    password = os.environ.get('ENLAYE_PASSWORD') or getpass.getpass('Enlaye password: ')
    if not password:
        sys.exit('No password given.')

    key = PBKDF2HMAC(algorithm=hashes.SHA256(), length=32, salt=bytes.fromhex(meta['salt']),
                     iterations=meta['iterations']).derive(password.encode())
    aes = AESGCM(key)

    # check the password against an existing file first, so a typo can't produce a file nobody can open
    probe = (ENLAYE_DIR / 'protected.html.enc').read_bytes()
    try:
        aes.decrypt(probe[:12], probe[12:], None)
    except Exception:
        sys.exit('That password does not open enlaye/protected.html.enc. Nothing was written.')

    iv = os.urandom(12)
    # file layout: 12-byte IV followed by ciphertext with the GCM tag appended
    (ENLAYE_DIR / f'{plain.name}.enc').write_bytes(iv + aes.encrypt(iv, plain.read_bytes(), None))
    plain.unlink()
    print(f'encrypted {plain.name} -> enlaye/{plain.name}.enc')


if __name__ == '__main__':
    main()
