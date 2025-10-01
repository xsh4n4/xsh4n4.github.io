---
title: "WatCTF F25/Crypto/Java-Oracle"
excerpt: "watctf{quantum_helix_padding_oracle}"
date: 2025-09-12
path: /notes/java-oracle/
categories: [notes]
tags: [watctf-f25, crypto, ctf, aes]
comments: true
support: true
last_modified_at: 2025-09-12T20:21:31
---

## Challenge Overview

The WatCTF java-oracle challenge presented an AES CBC encryption service with the following behavior:

**Server Process:**
- Encrypts a JSON message containing the flag: `{"access_code": "<FLAG>", "facility": "quantum_reactor_z9", "clearance": "alpha"}`
- Uses AES-128-CBC with random key `k` and random IV
- Provides the encrypted message (IV + ciphertext) in hex format
- Accepts user-submitted ciphertexts and reveals whether padding is valid or invalid
- Rejects the original ciphertext and messages shorter than 32 bytes

**Oracle Behavior:**
```
Valid padding    → "Valid padding"
Invalid padding  → "Invalid padding"
```

This binary response is all an attacker needs to decrypt the entire message.


## What is a Padding Oracle?

A **padding oracle** is any mechanism that reveals whether a ciphertext decrypts to plaintext with valid padding. The oracle acts as a black box that answers one simple question: "Is this padding correct?"

### Real-World Examples

**1. Detailed Error Messages**
```json
// Bad padding
{"code": 401, "msg": "decryption error"}

// Good padding, but invalid data
{"code": 401, "msg": "deserialization error"}
```

**2. Timing Side-Channels**

Even with generic error messages, timing differences can leak information:
- Invalid padding → Fast response (decryption fails immediately)
- Valid padding → Slower response (proceeds to deserialization before failing)

**3. HTTP Status Codes**
- 500 Internal Server Error (padding error)
- 400 Bad Request (valid padding, invalid data)

## Understanding CBC Mode

### Cipher Block Chaining (CBC)

In CBC mode, each plaintext block is XORed with the previous ciphertext block before encryption. This creates a chain where each block depends on all previous blocks.

**Encryption:**
```
C₀ = ENC_K(P₀ ⊕ IV)
Cᵢ = ENC_K(Pᵢ ⊕ Cᵢ₋₁)  for i ≥ 1
```

**Decryption:**
```
P₀ = DEC_K(C₀) ⊕ IV
Pᵢ = DEC_K(Cᵢ) ⊕ Cᵢ₋₁  for i ≥ 1
```

### Visual Representation

```
Encryption:
┌────────┐     ┌────────┐     ┌────────┐
│   IV   │     │   C₀   │     │   C₁   │
└───┬────┘     └───┬────┘     └───┬────┘
    │              │              │
    ⊕              ⊕              ⊕
    │              │              │
┌───┴────┐     ┌───┴────┐     ┌───┴────┐
│   P₀   │     │   P₁   │     │   P₂   │
└───┬────┘     └───┬────┘     └───┬────┘
    │              │              │
┌───▼────┐     ┌───▼────┐     ┌───▼────┐
│ ENC_K  │     │ ENC_K  │     │ ENC_K  │
└───┬────┘     └───┬────┘     └───┬────┘
    │              │              │
┌───▼────┐     ┌───▼────┐     ┌───▼────┐
│   C₀   │     │   C₁   │     │   C₂   │
└────────┘     └────────┘     └────────┘

Decryption:
┌────────┐     ┌────────┐     ┌────────┐
│   C₀   │     │   C₁   │     │   C₂   │
└───┬────┘     └───┬────┘     └───┬────┘
    │              │              │
┌───▼────┐     ┌───▼────┐     ┌───▼────┐
│ DEC_K  │     │ DEC_K  │     │ DEC_K  │
└───┬────┘     └───┬────┘     └───┬────┘
    │              │              │
    ⊕              ⊕              ⊕
    │              │              │
┌───┴────┐     ┌───┴────┐     ┌───┴────┐
│   IV   │     │   C₀   │     │   C₁   │
└───┬────┘     └───┬────┘     └───┬────┘
    │              │              │
┌───▼────┐     ┌───▼────┐     ┌───▼────┐
│   P₀   │     │   P₁   │     │   P₂   │
└────────┘     └────────┘     └────────┘
```

**Key Property:** Modifying the IV (or any ciphertext block) predictably modifies the next plaintext block through XOR.

## PKCS#7 Padding Scheme

PKCS#7 padding fills the last block to the required block size (16 bytes for AES-128).

### Padding Rules

If **M** bytes are missing from the last block, add **M** bytes each with value **M**.

### Examples

```
Block size: 16 bytes

Data: "HELLO" (5 bytes) → 11 bytes needed
Padded: HELLO\x0b\x0b\x0b\x0b\x0b\x0b\x0b\x0b\x0b\x0b\x0b

Data: "HELLO WORLD!!!!!" (16 bytes) → Full block, need new block
Padded: HELLO WORLD!!!!!\x10\x10\x10\x10\x10\x10\x10\x10\x10\x10\x10\x10\x10\x10\x10\x10

Data: "HELLO WORLD" (11 bytes) → 5 bytes needed
Padded: HELLO WORLD\x05\x05\x05\x05\x05

Data: "HELLO WORLD!123" (15 bytes) → 1 byte needed
Padded: HELLO WORLD!123\x01
```

### Validation

Padding is valid if:
1. Last byte value is between 1 and block_size (1-16)
2. Last N bytes all equal N (where N is the value of the last byte)


## The Vulnerability

### Mathematical Foundation

The core vulnerability stems from the CBC decryption formula:

```
Pᵢ = DEC_K(Cᵢ) ⊕ Cᵢ₋₁
```

If we create a random block **X** and use it as a fake "previous ciphertext block":

```
P' = DEC_K(C) ⊕ X
```

Rearranging:
```
DEC_K(C) = P' ⊕ X
```

If we know **P'** and **X**, we can calculate **DEC_K(C)** without the key!

Then to get the real plaintext:
```
P = DEC_K(C) ⊕ C_previous
```

### The Breakthrough

**The equation becomes pure XOR operations - no cryptography involved!**

We control **X** (our crafted IV), and the oracle tells us when **P'** has valid padding. By systematically trying different values of **X**, we can deduce what **P'** must be, thereby recovering **DEC_K(C)**.

## Attack Methodology

### Attack Overview

1. Take a ciphertext block we want to decrypt
2. Create a controllable "IV" block (all zeros initially)
3. Bruteforce byte values until padding is valid
4. Build a "zeroing IV" that makes plaintext all zeros
5. The zeroing IV equals DEC_K(ciphertext)
6. XOR with actual previous block to get real plaintext

### Step-by-Step Process

#### Phase 1: Attack the Last Byte

**Goal:** Find what makes the last byte of plaintext equal `0x01` (valid 1-byte padding)

```
Start with:
IV:  [00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00]
CT:  [?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ??]

Try IV byte 15:
For candidate = 0 to 255:
    IV[15] = candidate
    if oracle(IV + CT) == "valid":
        # Found it! The plaintext byte is 0x01
        DEC_K(CT)[15] = candidate ⊕ 0x01
        break
```

**Why this works:**
- `P[15] = DEC_K(CT)[15] ⊕ IV[15]`
- When `P[15] = 0x01`, padding is valid
- Therefore: `DEC_K(CT)[15] = 0x01 ⊕ IV[15]`

#### Phase 2: Build the Zeroing IV

Once we know `DEC_K(CT)[15]`, create an IV byte that makes plaintext zero:

```
zeroing_iv[15] = DEC_K(CT)[15] ⊕ 0x00 = DEC_K(CT)[15]
```

#### Phase 3: Attack Byte 14

**Goal:** Find what makes bytes 14-15 equal `0x02 0x02` (valid 2-byte padding)

```
Set IV to create 0x02 padding:
IV[15] = DEC_K(CT)[15] ⊕ 0x02  # Forces P[15] = 0x02

Try IV byte 14:
For candidate = 0 to 255:
    IV[14] = candidate
    if oracle(IV + CT) == "valid":
        # P[14:16] = 0x02 0x02
        DEC_K(CT)[14] = candidate ⊕ 0x02
        break
```

#### Phase 4: Repeat for All Bytes

Continue this pattern for bytes 13, 12, 11, ..., 0:

```python
for pad_length in range(1, 17):
    # Set all known bytes to create correct padding
    for i in range(pad_length - 1):
        iv[16 - i - 1] = zeroing_iv[16 - i - 1] ⊕ pad_length
    
    # Bruteforce the next unknown byte
    for candidate in range(256):
        iv[16 - pad_length] = candidate
        if oracle(iv + ct):
            zeroing_iv[16 - pad_length] = candidate ⊕ pad_length
            break
```

#### Phase 5: Recover Real Plaintext

Once we have the complete zeroing IV:

```
zeroing_iv = DEC_K(CT)
real_plaintext = zeroing_iv ⊕ actual_previous_block
```

### Edge Case Handling

**Problem:** When attacking byte 15, if byte 14 happens to already contain `0x02`, then `?? 0x02` would also be valid padding.

**Solution:** After finding a valid candidate for byte 15:
```python
if pad_length == 1:
    # Flip byte 14 and test again
    iv[14] ^= 1
    if not oracle(iv + ct):
        # False positive! Keep searching
        continue
```

## Implementation

### Complete Python Script

```python
#!/usr/bin/env python3
import socket
from Crypto.Util.Padding import unpad
from Crypto.Util.strxor import strxor

def recvuntil(s, tail):
    """Receive data until a specific tail is found"""
    data = b''
    while True:
        if tail in data:
            return data.decode()
        data += s.recv(1)

def check_padding(s, ct_hex):
    """Send ciphertext to oracle and check if padding is valid"""
    data = recvuntil(s, b'> ')
    print(data + ct_hex)
    s.sendall(ct_hex.encode() + b'\n')
    data = recvuntil(s, b'\n').rstrip()
    print(data)
    return data == 'Valid padding'

def attack_block(s, target_block, previous_block):
    """Attack a single block using padding oracle"""
    BLOCK_SIZE = 16
    zeroing_iv = bytearray(BLOCK_SIZE)
    
    # Attack each byte from right to left
    for pad_val in range(1, BLOCK_SIZE + 1):
        # Create IV that sets known bytes to current padding value
        padding_iv = bytearray(BLOCK_SIZE)
        for i in range(pad_val - 1):
            padding_iv[BLOCK_SIZE - 1 - i] = zeroing_iv[BLOCK_SIZE - 1 - i] ^ pad_val
        
        # Bruteforce current byte
        found = False
        for candidate in range(256):
            padding_iv[BLOCK_SIZE - pad_val] = candidate
            test_ct = padding_iv.hex() + target_block.hex()
            
            if check_padding(s, test_ct):
                # Edge case check for first byte
                if pad_val == 1:
                    # Verify this is really 0x01 padding, not 0x02 0x02
                    padding_iv[BLOCK_SIZE - 2] ^= 1
                    test_ct = padding_iv.hex() + target_block.hex()
                    if not check_padding(s, test_ct):
                        continue  # False positive
                
                # Found valid padding!
                zeroing_iv[BLOCK_SIZE - pad_val] = candidate ^ pad_val
                found = True
                print(f"[+] Found byte {BLOCK_SIZE - pad_val}: 0x{zeroing_iv[BLOCK_SIZE - pad_val]:02x}")
                break
        
        if not found:
            raise Exception(f"Failed to find valid padding for byte {BLOCK_SIZE - pad_val}")
    
    # XOR zeroing_iv with previous block to get plaintext
    plaintext = strxor(bytes(zeroing_iv), previous_block)
    return plaintext

def padding_oracle_attack(s, original_hex):
    """Perform full padding oracle attack on multi-block ciphertext"""
    original = bytes.fromhex(original_hex)
    BLOCK_SIZE = 16
    
    # Split into blocks
    blocks = [original[i:i+BLOCK_SIZE] for i in range(0, len(original), BLOCK_SIZE)]
    
    plaintext = b''
    
    # Attack each block (skip first block which is IV)
    for i in range(1, len(blocks)):
        print(f"\n[*] Attacking block {i}/{len(blocks)-1}")
        block_plaintext = attack_block(s, blocks[i], blocks[i-1])
        plaintext += block_plaintext
        print(f"[*] Recovered: {block_plaintext}")
    
    # Remove PKCS7 padding
    plaintext = unpad(plaintext, BLOCK_SIZE)
    return plaintext

# Main execution
def main():
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.connect(('challs.watctf.org', 2013))
    
    # Receive original ciphertext
    data = recvuntil(s, b'\n').rstrip()
    print(data)
    original_hex = data.strip()
    
    print("\n[*] Starting Padding Oracle Attack...")
    plaintext = padding_oracle_attack(s, original_hex)
    
    print("\n" + "="*60)
    print("DECRYPTED MESSAGE:")
    print("="*60)
    print(plaintext.decode())
    print("="*60)
    
    s.close()

if __name__ == '__main__':
    main()
```

### Key Functions Explained

**1. check_padding()**
- Sends crafted ciphertext to server
- Returns True if padding is valid, False otherwise
- This is our "oracle"

**2. attack_block()**
- Attacks a single 16-byte block
- Builds zeroing_iv byte-by-byte
- Returns decrypted plaintext for that block

**3. padding_oracle_attack()**
- Orchestrates the full attack
- Processes all blocks sequentially
- Removes final PKCS7 padding


## Solution Walkthrough

### Initial Connection

```
$ python3 exploit.py
1424d584131b7317724373f7fb522009d7cc95ef9857c24e65ad6602200a9cccf3dcd6e09b517d6f6a528bcf21b09bf517de03190f5e197bca75e98165c7f700ae554d22a7bf5a9bbb727b184fe5967be85eb45410fb7c4e3ceffc89ad9a70c612dc5eb66b19a2d8246833ad504cbda17a975f4203438ef13a78c3660f1d14df

[*] Starting Padding Oracle Attack...
```

### Block Structure

The original ciphertext breaks down to:
- **Block 0 (IV)**: `1424d584131b7317724373f7fb522009`
- **Block 1**: `d7cc95ef9857c24e65ad6602200a9ccc`
- **Block 2**: `f3dcd6e09b517d6f6a528bcf21b09bf5`
- **Block 3**: `17de03190f5e197bca75e98165c7f700`
- **Block 4**: `ae554d22a7bf5a9bbb727b184fe5967b`
- **Block 5**: `e85eb45410fb7c4e3ceffc89ad9a70c6`
- **Block 6**: `12dc5eb66b19a2d8246833ad504cbda1`
- **Block 7**: `7a975f4203438ef13a78c3660f1d14df`

### Attacking Block 7 (Last Block)

```
[*] Attacking block 7/7

Trying byte 15: candidate = 0
Submit: 00000000000000000000000000000000 + 7a975f4203438ef13a78c3660f1d14df
Response: Invalid padding

Trying byte 15: candidate = 1
Submit: 00000000000000000000000000000001 + 7a975f4203438ef13a78c3660f1d14df
Response: Invalid padding

...

Trying byte 15: candidate = 99 (0x63)
Submit: 00000000000000000000000000000063 + 7a975f4203438ef13a78c3660f1d14df
Response: Valid padding
[+] Found byte 15: 0x62

Now attack byte 14 with padding 0x02 0x02:
Submit: 00000000000000000000000000006062 + 7a975f4203438ef13a78c3660f1d14df
...
```

This process repeats for all 16 bytes of block 7, then moves backward through blocks 6, 5, 4, 3, 2, 1.

### Recovered Message

```
Block 1: {"access_code"
Block 2: : "watctf{quan
Block 3: tum_helix_padd
Block 4: ing_oracle}", 
Block 5: "facility": "q
Block 6: uantum_reactor
Block 7: _z9", "clearan
Block 8: ce": "alpha"}
```

### Final Output

```
==============================================================
DECRYPTED MESSAGE:
==============================================================
{"access_code": "watctf{quantum_helix_padding_oracle}", "facility": "quantum_reactor_z9", "clearance": "alpha"}
==============================================================
```

**FLAG:** `watctf{quantum_helix_padding_oracle}`


## Defense Mechanisms

### 1. Use Authenticated Encryption

**Best Practice:** Switch to authenticated encryption modes that prevent tampering.

```python
# Bad: AES-CBC without authentication
cipher = AES.new(key, AES.MODE_CBC, iv)
ciphertext = cipher.encrypt(padded_data)

# Good: AES-GCM (authenticated encryption)
cipher = AES.new(key, AES.MODE_GCM)
ciphertext, tag = cipher.encrypt_and_digest(data)
```

Recommended modes:
- **AES-GCM** (Galois/Counter Mode)
- **AES-OCB** (Offset Codebook Mode)
- **ChaCha20-Poly1305**

### 2. Encrypt-then-MAC

If you must use CBC mode, add authentication:

```python
# Encrypt
cipher = AES.new(key_enc, AES.MODE_CBC, iv)
ciphertext = cipher.encrypt(padded_data)

# Then MAC
mac = HMAC.new(key_mac, iv + ciphertext, SHA256).digest()

# Send: iv + ciphertext + mac
```

**Verification before decryption:**
```python
# Verify MAC first
expected_mac = HMAC.new(key_mac, iv + ciphertext, SHA256).digest()
if not hmac.compare_digest(mac, expected_mac):
    raise AuthenticationError("Invalid MAC")

# Only decrypt if MAC is valid
cipher = AES.new(key_enc, AES.MODE_CBC, iv)
plaintext = unpad(cipher.decrypt(ciphertext), AES.block_size)
```

### 3. Remove Padding Information Leakage

**Bad:**
```python
try:
    plaintext = unpad(decrypted, AES.block_size)
    process(plaintext)
except ValueError as e:
    return {"error": "Invalid padding"}  # ORACLE!
```

**Better (but still vulnerable to timing):**
```python
try:
    plaintext = unpad(decrypted, AES.block_size)
    process(plaintext)
except Exception:
    return {"error": "Invalid request"}  # Generic error
```

**Best:**
```python
# Verify MAC before any decryption
if not verify_mac(message):
    return {"error": "Invalid request"}

# Only decrypt authenticated messages
plaintext = decrypt_and_unpad(message)
```

### 4. Constant-Time Operations

Prevent timing side-channels:

```python
import hmac

# Bad: Early return on first mismatch
def verify_mac_bad(mac1, mac2):
    for a, b in zip(mac1, mac2):
        if a != b:
            return False  # Timing leak!
    return True

# Good: Constant-time comparison
def verify_mac_good(mac1, mac2):
    return hmac.compare_digest(mac1, mac2)
```

### 5. Rate Limiting

Even with fixed issues, rate limit decryption attempts:

```python
from flask_limiter import Limiter

limiter = Limiter(app, default_limits=["100 per hour"])

@app.route('/decrypt', methods=['POST'])
@limiter.limit("10 per minute")
def decrypt_endpoint():
    # Decryption logic
    pass
```


## Conclusion

The Padding Oracle Attack demonstrates how seemingly minor information leakage can completely compromise cryptographic systems. The elegance of the attack lies in its simplicity: using only XOR operations and binary feedback, an attacker can decrypt arbitrary ciphertexts without knowing the encryption key.

This challenge from WatCTF F25 perfectly illustrates why:
1. **Authenticated encryption is essential** in modern systems
2. **Side channels must be considered** during security design
3. **Defense in depth** provides the best protection

The recovered flag `watctf{quantum_helix_padding_oracle}` serves as a reminder that even quantum-sounding names can't protect against mathematical vulnerabilities in cryptographic implementations.

**Remember:** When implementing cryptography, use well-tested libraries, follow current best practices, and never roll your own crypto!
