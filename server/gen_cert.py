"""
Generate a self-signed SSL certificate for local HTTPS development.

The browser will show a warning like "Your connection is not private"
or "NET::ERR_CERT_AUTHORITY_INVALID" — this is EXPECTED for any
self-signed cert. It's safe to bypass:
  - Chrome: click "Advanced" → "Proceed to 127.0.0.1 (unsafe)"
  - Firefox: click "Advanced" → "Accept the Risk and Continue"
  - Edge: click "Advanced" → "Continue to 127.0.0.1 (unsafe)"

For a permanent fix, you can add this cert to your system's trusted
root store (see instructions below), but for daily development the
one-click bypass is perfectly fine.
"""

import os
import subprocess
import sys

CERT_DIR = os.path.dirname(os.path.abspath(__file__))
CERT_FILE = os.path.join(CERT_DIR, 'server.crt')
KEY_FILE  = os.path.join(CERT_DIR, 'server.key')

# ─── Method 1: Use the 'cryptography' library (if installed) ────────

def gen_with_cryptography():
    from cryptography import x509
    from cryptography.x509.oid import NameOID
    from cryptography.hazmat.primitives import hashes, serialization
    from cryptography.hazmat.primitives.asymmetric import rsa
    import datetime
    import ipaddress

    key = rsa.generate_private_key(public_exponent=65537, key_size=2048)

    subject = issuer = x509.Name([
        x509.NameAttribute(NameOID.COMMON_NAME, '127.0.0.1'),
    ])

    cert = (
        x509.CertificateBuilder()
        .subject_name(subject)
        .issuer_name(issuer)
        .public_key(key.public_key())
        .serial_number(1000)
        .not_valid_before(datetime.datetime.utcnow())
        .not_valid_after(datetime.datetime.utcnow() + datetime.timedelta(days=365 * 5))
        .add_extension(
            x509.SubjectAlternativeName([
                x509.IPAddress(ipaddress.ip_address('127.0.0.1')),
                x509.DNSName('localhost'),
            ]),
            critical=False,
        )
        .sign(key, hashes.SHA256())
    )

    with open(KEY_FILE, 'wb') as f:
        f.write(key.private_bytes(
            serialization.Encoding.PEM,
            serialization.PrivateFormat.TraditionalOpenSSL,
            serialization.NoEncryption(),
        ))

    with open(CERT_FILE, 'wb') as f:
        f.write(cert.public_bytes(serialization.Encoding.PEM))

    return True


# ─── Method 2: Use openssl command-line tool (fallback) ────────────

def gen_with_openssl():
    subprocess.run([
        'openssl', 'req', '-x509', '-newkey', 'rsa:2048',
        '-keyout', KEY_FILE,
        '-out', CERT_FILE,
        '-days', '1825',
        '-nodes',
        '-subj', '/CN=127.0.0.1',
        '-addext', 'subjectAltName=IP:127.0.0.1,DNS:localhost',
    ], check=True)
    return True


# ─── Main ──────────────────────────────────────────────────────────

def main():
    # Try cryptography library first (richer cert), fall back to openssl
    try:
        gen_with_cryptography()
        method = 'cryptography library'
    except ImportError:
        print('[warn] cryptography library not found, trying openssl...')
        try:
            gen_with_openssl()
            method = 'openssl'
        except (FileNotFoundError, subprocess.CalledProcessError) as e:
            print('[error] Could not generate certificate.')
            print('  Install the cryptography library:  pip install cryptography')
            print('  Or install OpenSSL:                https://openssl.org/')
            print(f'  Details: {e}')
            sys.exit(1)
    except Exception as e:
        print(f'[error] cryptography failed: {e}')
        print('  Trying openssl fallback...')
        try:
            gen_with_openssl()
            method = 'openssl (fallback)'
        except Exception as e2:
            print(f'[error] openssl also failed: {e2}')
            sys.exit(1)

    print(f'OK - certificates generated via {method}')
    print(f'  Cert: {CERT_FILE}')
    print(f'  Key:  {KEY_FILE}')
    print()
    print('To trust this cert locally (optional, removes browser warning):')
    print('  Windows (Admin PowerShell):')
    print('    Import-Certificate -FilePath "server/server.crt" -CertStoreLocation Cert:\\LocalMachine\\Root')
    print('  macOS:')
    print('    sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain server/server.crt')
    print('  Linux:')
    print('    sudo cp server/server.crt /usr/local/share/ca-certificates/ && sudo update-ca-certificates')


if __name__ == '__main__':
    main()
