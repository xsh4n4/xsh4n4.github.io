---
title: "SnakeCTF 2025 Quals/Rev/Parallel Flagging"
excerpt: "snakeCTF{p4r4ll3l_pr0c3ss1ng_m4k3s_3v3ryth1ng_f4st3r_but_n0t_s3cur3r_4g41nst_kn0wn_pl41nt3xt!}"
date: 2025-08-30
path: /notes/parallel-flagging/
categories: [notes]
tags: [ snake-ctf-2k25, rev, ctf]
comments: true
support: true
last_modified_at: 2025-08-30T11:21:31
---

## Challenge Overview

When I first saw this challenge, the title "Parallel Flagging" immediately caught my attention. The description said *"The best way to encrypt a flag is to encrypt all of it at the same time, no?"* which gave me a strong hint that we're dealing with some kind of parallel block encryption scheme. I downloaded the files and found `solve.py` along with an `output.txt` containing what appeared to be hex-encoded encrypted data.

## Initial Reconnaissance

I started by examining the encrypted output file. It contained 256 bytes of hex data, which was interesting - that's a pretty standard size that divides nicely into blocks. My first instinct was to reverse engineer the encryption algorithm to understand what we're working with.

Looking at the challenge binary and the provided solver template, I could see the general flow of the encryption:

1. The flag gets padded to exactly 256 bytes using '-' characters
2. This padded data is divided into 8 blocks of 32 bytes each
3. Each block gets processed independently (hence "parallel"!) by a `kernel` function
4. The kernel uses an 8-byte key that's pulled from the environment

## Reversing the Kernel Function

Now, I had a choice here - I could spend hours diving into the assembly code of the kernel function, or I could take a more pragmatic approach. I decided to black-box test it first to see if I could understand its behavior without fully reversing every instruction.

I ran a few test inputs through the encryption and observed the outputs. What I noticed was really interesting:

- The output length always matched the input length (32 bytes)
- Changing a single input byte affected multiple output bytes
- There seemed to be a consistent transformation pattern

After playing around with it for a bit, I realized the kernel was doing two main operations:

1. **XOR Encryption**: Each byte gets XORed with a byte from the 8-byte key (with some offset calculation)
2. **Scrambling**: The bytes get shuffled according to a fixed permutation map

The scramble map I extracted was:
```python
scramble_map = [15, 21, 2, 18, 6, 27, 7, 17, 13, 24, 26, 4, 29, 16, 20, 5, 22, 31, 11, 10, 12, 28, 3, 19, 14, 30, 8, 25, 1, 0, 23, 9]
```

This meant that byte 0 moves to position 15, byte 1 moves to position 21, and so on.

## The Known Plaintext Attack

Here's where things got exciting! I knew that CTF flags typically follow a format, and this challenge was from SnakeCTF, so the flag almost certainly starts with `snakeCTF`. This is a classic known plaintext attack opportunity!

Since I knew the first 8 bytes of the plaintext (`snakeCTF`), I could work backwards to recover the encryption key. But there was a catch - the scrambling meant that these bytes weren't necessarily at positions 0-7 in the encrypted output.

I needed to figure out where `snakeCTF` ended up after the scrambling. By analyzing the scramble map for block 0, I traced where each character would land:

```python
positions = [29, 28, 2, 22, 11, 15, 4, 6]
format = b"snakeCTF"
```

So 's' ended up at position 29, 'n' at position 28, 'a' at position 2, and so on.

## Key Recovery

Now I could recover the key! For each known plaintext byte, I XORed it with the corresponding encrypted byte:

```python
key = ''.join([chr(data[positions[i]] ^ format[i]) for i in range(8)])
```

But wait - when I tried this key, something wasn't quite right. I dug back into the encryption logic and found the issue: the key indexing has a rotation based on the block ID. For block 0 specifically, there's an offset of +7 in the key selection, which effectively rotates the key by one position to the left.

So I adjusted:
```python
key = key[1:] + key[0]  # Rotate to account for block 0's +7 offset
```

Hurray! Now I had the correct key!

## Building the Decryption Function

With the key in hand, I needed to reverse the encryption process. This meant:

1. **Creating an inverse scramble map** - I needed to undo the byte shuffling:
```python
inverse_scramble = [0] * 32
for i, v in enumerate(scramble_map):
    inverse_scramble[v] = i
```

2. **Unscrambling each block** - Apply the inverse permutation to get back the XORed data

3. **Reversing the XOR** - The XOR operation used a complex indexing scheme:
```python
mod_block = block_id ^ 17
for i in range(32):
    shared_data[i] ^= ord(key[(block_id + i + (7 * mod_block)) % 8])
```

The `mod_block` value changes for each block (it's the block ID XORed with 17), which means the key offset pattern is different for each block. This is actually pretty clever - it prevents simple patterns from appearing across blocks.

## Putting It All Together

I wrote the complete decryption function that:
1. Reads the hex data from `output.txt`
2. Recovers the encryption key using the known plaintext
3. Processes each of the 8 blocks:
   - Unscrambles the bytes using the inverse map
   - XORs with the appropriate key bytes
4. Reconstructs the complete plaintext
5. Strips the padding characters

The full solver handles all the numpy array manipulations efficiently, processes the hex input correctly, and carefully manages the block-by-block decryption with the proper key offsets.

## Running the Solution

I ran my solver script:
```bash
python3 solve.py .
```

First, it printed out the recovered key, confirming my approach was correct. Then...

**Flag**: `snakeCTF{p4r4ll3l_pr0c3ss1ng_m4k3s_3v3ryth1ng_f4st3r_but_n0t_s3cur3r_4g41nst_kn0wn_pl41nt3xt!}`

Hurray! The flag reveals an important lesson - parallel processing might make encryption faster, but it doesn't make it more secure, especially when you have known plaintext to work with!

## Key Takeaways

This challenge taught me several important lessons:

- **Known plaintext attacks are powerful**: When you know the flag format, you can often recover encryption keys
- **Block ciphers need proper modes**: Processing blocks independently without proper chaining makes them vulnerable
- **Black-box analysis saves time**: I didn't need to fully reverse the kernel function to understand its behavior
- **Pay attention to index calculations**: The key rotation and block-specific offsets were crucial details
- **Custom crypto is dangerous**: This challenge showcases why you shouldn't roll your own encryption schemes

Overall, this was a fun reversing challenge that combined cryptanalysis with practical reverse engineering. The "parallel" theme was well-executed, and exploiting the independent block processing to recover the key was very satisfying!

## Solution Code

```python
#!/usr/bin/env python3
import os
import numpy as np
import sys

path = sys.argv[1]
scramble_map = [15, 21, 2, 18, 6, 27, 7, 17, 13, 24, 26, 4, 29, 16, 20, 5, 22, 31, 11, 10, 12, 28, 3, 19, 14, 30, 8, 25,
                1, 0, 23, 9]

inverse_scramble = [0] * 32
for i, v in enumerate(scramble_map):
    inverse_scramble[v] = i


def unscramble_block(block_data, block_id, key):
    scrambled = np.array(list(block_data), dtype=np.uint8)
    shared_data = np.zeros(32, dtype=np.uint8)

    for i in range(32):
        shared_data[i] = scrambled[inverse_scramble[i]]

    mod_block = block_id ^ 17
    for i in range(32):
        shared_data[i] ^= ord(key[(block_id + i + (7 * mod_block)) % 8])

    return shared_data


def hex_to_bytes(hex_string):
    hex_values = hex_string.strip().split()
    return np.array([int(byte, 16) for byte in hex_values], dtype=np.uint8)


def main():
    positions = [29, 28, 2, 22, 11, 15, 4, 6]
    format = b"snakeCTF"

    # Read hex from file
    with open(os.path.join(path, 'output.txt'), "r") as f:
        hex_string = f.read()

    data = hex_to_bytes(hex_string)
    assert len(data) == 256

    key = ''.join([chr(data[positions[i]] ^ format[i]) for i in range(8)])

    key = key[1:] + key[0]  # (for block 0 the key index is +7)

    print(key)

    num_blocks = 8
    block_size = 32

    original_data = np.zeros_like(data)

    for block_id in range(num_blocks):
        start = block_id * block_size
        end = start + block_size
        block = data[start:end]
        unscrambled_block = unscramble_block(block, block_id, key)
        original_data[start:end] = unscrambled_block

    # Convert bytes to string and strip padding
    original_str = ''.join(chr(b) for b in original_data).rstrip('-')
    print(original_str)


if __name__ == "__main__":
    main()
```