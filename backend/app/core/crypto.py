"""
TeleVault Cryptography Module
Implements: AES-256-CBC encryption, HMAC-SHA256 integrity, Argon2id key derivation

Blob format per chunk:
  [IV: 16 bytes] [HMAC: 32 bytes] [AES-256-CBC Ciphertext: N bytes]
"""
import os
import secrets
import hmac
import hashlib
from typing import Tuple

from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.primitives import padding
from cryptography.hazmat.backends import default_backend
from argon2.low_level import hash_secret_raw, Type

from app.config import settings

IV_SIZE       = settings.IV_SIZE        # 16 bytes
HMAC_SIZE     = settings.HMAC_TAG_SIZE  # 32 bytes
HEADER_SIZE   = IV_SIZE + HMAC_SIZE     # 48 bytes
BLOCK_SIZE    = 16                      # AES block size


# ── Key Derivation ────────────────────────────────────────────────

def derive_kek(master_password: str, salt: bytes) -> bytes:
    """
    Derive Key Encryption Key (KEK) from master password using Argon2id.
    KEK is used to encrypt/decrypt per-file AES and HMAC keys.
    Never stored to disk.
    """
    return hash_secret_raw(
        secret=master_password.encode(),
        salt=salt,
        time_cost=settings.ARGON2_TIME_COST,
        memory_cost=settings.ARGON2_MEMORY_COST,
        parallelism=settings.ARGON2_PARALLELISM,
        hash_len=settings.ARGON2_HASH_LENGTH,
        type=Type.ID,
    )


def generate_kek_salt() -> bytes:
    """Generate a random 32-byte salt for Argon2id."""
    return secrets.token_bytes(32)


def generate_file_keys() -> Tuple[bytes, bytes]:
    """Generate random per-file AES key (32B) and HMAC key (32B)."""
    aes_key  = secrets.token_bytes(settings.AES_KEY_SIZE)
    hmac_key = secrets.token_bytes(settings.HMAC_KEY_SIZE)
    return aes_key, hmac_key


def encrypt_file_keys(aes_key: bytes, hmac_key: bytes, kek: bytes) -> bytes:
    """
    Encrypt the per-file AES + HMAC keys with the KEK.
    Returns: IV (16B) || HMAC (32B) || AES-CBC(aes_key || hmac_key)
    """
    plaintext = aes_key + hmac_key  # 64 bytes
    return encrypt_blob(plaintext, kek, kek[:HMAC_SIZE])  # use kek as both AES and HMAC key for key blob


def decrypt_file_keys(encrypted_keys: bytes, kek: bytes) -> Tuple[bytes, bytes]:
    """Decrypt per-file keys using KEK. Returns (aes_key, hmac_key)."""
    plaintext = decrypt_blob(encrypted_keys, kek, kek[:HMAC_SIZE])
    aes_key  = plaintext[:settings.AES_KEY_SIZE]
    hmac_key = plaintext[settings.AES_KEY_SIZE:]
    return aes_key, hmac_key


# ── Chunk Encryption ──────────────────────────────────────────────

def encrypt_chunk(plaintext: bytes, aes_key: bytes, hmac_key: bytes, is_last: bool = False) -> bytes:
    """
    Encrypt a single chunk.
    Returns blob: IV (16B) || HMAC (32B) || AES-256-CBC(plaintext)
    
    Only the last chunk is PKCS7-padded.
    All other chunks are naturally aligned to 1.5 MB (divisible by 16).
    """
    return encrypt_blob(plaintext, aes_key, hmac_key, pad=is_last)


def decrypt_chunk(blob: bytes, aes_key: bytes, hmac_key: bytes, is_last: bool = False) -> bytes:
    """Decrypt a single chunk blob. Unpad only if it's the last chunk."""
    return decrypt_blob(blob, aes_key, hmac_key, unpad=is_last)


def verify_chunk_hmac(blob: bytes, hmac_key: bytes) -> bool:
    """Verify the HMAC of a chunk blob without decrypting."""
    if len(blob) < HEADER_SIZE:
        return False
    stored_hmac    = blob[IV_SIZE:HEADER_SIZE]
    ciphertext     = blob[HEADER_SIZE:]
    recomputed     = _compute_hmac(ciphertext, hmac_key)
    return hmac.compare_digest(stored_hmac, recomputed)


# ── Internal helpers ──────────────────────────────────────────────

def encrypt_blob(plaintext: bytes, aes_key: bytes, hmac_key: bytes, pad: bool = True) -> bytes:
    iv = secrets.token_bytes(IV_SIZE)
    if pad:
        padder = padding.PKCS7(128).padder()
        plaintext = padder.update(plaintext) + padder.finalize()
    cipher = Cipher(algorithms.AES(aes_key), modes.CBC(iv), backend=default_backend())
    enc = cipher.encryptor()
    ciphertext = enc.update(plaintext) + enc.finalize()
    tag = _compute_hmac(ciphertext, hmac_key)
    return iv + tag + ciphertext


def decrypt_blob(blob: bytes, aes_key: bytes, hmac_key: bytes, unpad: bool = True) -> bytes:
    iv         = blob[:IV_SIZE]
    stored_tag = blob[IV_SIZE:HEADER_SIZE]
    ciphertext = blob[HEADER_SIZE:]

    # Verify HMAC first (authenticate-then-decrypt)
    recomputed = _compute_hmac(ciphertext, hmac_key)
    if not hmac.compare_digest(stored_tag, recomputed):
        raise ValueError("HMAC verification failed — chunk may be corrupted or tampered")

    cipher = Cipher(algorithms.AES(aes_key), modes.CBC(iv), backend=default_backend())
    dec = cipher.decryptor()
    plaintext = dec.update(ciphertext) + dec.finalize()

    if unpad:
        unpadder = padding.PKCS7(128).unpadder()
        plaintext = unpadder.update(plaintext) + unpadder.finalize()

    return plaintext


def _compute_hmac(ciphertext: bytes, hmac_key: bytes) -> bytes:
    return hmac.new(hmac_key, ciphertext, hashlib.sha256).digest()
