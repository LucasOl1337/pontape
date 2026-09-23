"""Pinned OTS adapter. Only public files. No key, credential or subprocess output is logged."""
import hashlib
from contextlib import closing
import json
from pathlib import Path
import subprocess
import sys
from datetime import datetime, timezone

from opentimestamps.core.timestamp import DetachedTimestampFile
from opentimestamps.core.serialize import BytesDeserializationContext
from opentimestamps.core.op import OpSHA256
from opentimestamps.core.notary import BitcoinBlockHeaderAttestation, PendingAttestation


def inspect_proof(target, proof):
    raw = Path(proof).read_bytes()
    if len(raw) > 4 * 1024 * 1024:
        raise ValueError("proof too large")
    detached = DetachedTimestampFile.deserialize(BytesDeserializationContext(raw))
    if not isinstance(detached.file_hash_op, OpSHA256):
        raise ValueError("expected SHA-256")
    if detached.file_digest != hashlib.sha256(Path(target).read_bytes()).digest():
        raise ValueError("proof does not bind target")
    attestations = list(detached.timestamp.all_attestations())
    if not any(isinstance(att, (PendingAttestation, BitcoinBlockHeaderAttestation)) for _, att in attestations):
        raise ValueError("no supported attestation")
    return attestations


def bitcoin_confirmation(attestations):
    # Verify locally against Bitcoin mainnet; never infer confirmation from an unverified height.
    from bitcoin import SelectParams
    from bitcoin.core import b2lx
    from bitcoin.rpc import Proxy
    SelectParams('mainnet')
    for msg, att in attestations:
        if not isinstance(att, BitcoinBlockHeaderAttestation):
            continue
        try:
            with closing(Proxy(timeout=15)) as proxy:
                if proxy._call('getblockchaininfo')['chain'] != 'main':
                    continue
                blockhash = proxy.getblockhash(att.height)
                blockheader = proxy.getblockheader(blockhash)
                attested = att.verify_against_blockheader(msg, blockheader)
                iso = lambda value: value.isoformat(timespec='milliseconds').replace('+00:00', 'Z')
                return {'height': str(att.height), 'blockHash': b2lx(blockhash),
                        'attestedAt': iso(datetime.fromtimestamp(attested, timezone.utc)),
                        'verifiedAt': iso(datetime.now(timezone.utc))}
        except Exception:
            continue  # No Core / invalid proof / unavailable block: still pending, never confirmed.
    return None


def main():
    operation, target = sys.argv[1:3]
    proof = target + '.ots'
    ots = str(Path(sys.executable).with_name('ots'))
    if operation == 'stamp':
        subprocess.run([ots, 'stamp', target], check=True, capture_output=True, timeout=90)
    elif operation == 'upgrade':
        # OTS exits 1 when a valid proof is still pending. Inspect bytes independently afterwards.
        subprocess.run([ots, 'upgrade', proof], check=False, capture_output=True, timeout=90)
    elif operation != 'inspect':
        raise ValueError('unknown operation')
    attestations = inspect_proof(target, proof)
    bitcoin = bitcoin_confirmation(attestations) if operation == 'upgrade' else None
    print(json.dumps({'status': 'confirmed' if bitcoin else 'pending', 'bitcoin': bitcoin}))


if __name__ == '__main__':
    try:
        main()
    except Exception:
        print('Falha OTS: confira instalação, arquivo público e conexão.', file=sys.stderr)
        sys.exit(1)
