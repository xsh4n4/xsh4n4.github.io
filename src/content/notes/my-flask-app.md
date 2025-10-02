---
title: "SekaiCTF 2025/Web/My Flask App"
excerpt: "sekai{!s-+h1s_3VEN_<all3d_a_cv3}"
date: 2025-08-17
path: /notes/my-flask-app/
categories: [notes]
tags: [ sekai-ctf-2k25, web, ctf]
comments: true
support: true
last_modified_at: 2025-08-17T16:21:31
---

## Challenge Overview

While competing in **Sekai CTF 2025**, I came across an interesting web challenge called **My Flask App**. Initially, it seemed like your typical Flask application with a file reading vulnerability, but there was an interesting twist that made it more engaging than expected. Let me walk you through my approach to solving this one.

## Initial Analysis

Whenever I tackle web challenges, my first step is always to examine the **Dockerfile**. This usually reveals important details about how the application is configured and deployed.

Here's what I found:

```docker
FROM python:3.11-slim

RUN pip install --no-cache-dir flask==3.1.1

WORKDIR /app

COPY app .

RUN mv flag.txt /flag-$(cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 32 | head -n 1).txt && \
    chown -R nobody:nogroup /app

USER nobody

EXPOSE 5000

CMD ["python", "app.py"]
```

The interesting part here was the flag handling. Instead of leaving it at a predictable location like `/flag.txt`, the setup script renames it to something like `/flag-VenUXnNXjh9MJxOH6m8xHvAR2oG9cmmG.txt` — a completely random 32-character alphanumeric string appended to the filename.

This immediately told me that while exploiting the application might be straightforward, discovering the actual flag location would require some creative thinking. Brute-forcing 32 random characters? Not happening.

## Examining the Application Code

Next, I dove into `app.py` to understand what we're working with:

```python
from flask import Flask, request, render_template

app = Flask(__name__)

@app.route('/')
def hello_world():
    return render_template('index.html')

@app.route('/view')
def view():
    filename = request.args.get('filename')
    if not filename:
        return "Filename is required", 400
    try:
        with open(filename, 'r') as file:
            content = file.read()
        return content, 200
    except FileNotFoundError:
        return "File not found", 404
    except Exception as e:
        return f"Error: {str(e)}", 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
```

The application was remarkably simple:
- The root endpoint (`/`) just serves a basic HTML page
- The `/view` endpoint accepts a `filename` parameter and reads its contents
- Most importantly: **no input validation whatsoever**
- I noticed `debug=True` was enabled, but at first I didn't think much of it — figured it was just left in during development

This was clearly a **Local File Inclusion (LFI)** vulnerability. I could read any file on the system that the `nobody` user had permissions for. The vulnerability itself was trivial to exploit.

The real challenge? Finding where that randomly-named flag file was hiding.

## Hunting for the Flag

With unrestricted file read access, I had plenty of options to explore. In Linux containers, the `/proc` filesystem is a goldmine of runtime information about the system and running processes.

I started testing various paths:
- `/proc/self/cmdline` - showed the command used to start the process
- `/proc/self/environ` - environment variables
- `/proc/self/cwd` - current working directory

Then I remembered something about how Linux tracks filesystem mounts. Every mounted filesystem gets logged by the kernel, and this information is accessible through `/proc/mounts`.

I made a request to:
```
/view?filename=/proc/mounts
```

And there it was, clear as day:

```
/dev/nvme0n1p1 /flag-VenUXnNXjh9MJxOH6m8xHvAR2oG9cmmG.txt ext4 ro,...
```

The complete path to the flag file, including the random suffix, just sitting there in the mount table!

## Understanding the Mount Leak

Initially, I wondered why the randomized filename would even appear in `/proc/mounts`. After thinking about it, I realized what was happening.

The challenge infrastructure wasn't just copying the flag into the container — it was using a **bind mount** to make the flag file available inside the container. 

In Linux, a bind mount creates an additional reference to an existing file or directory at a different location in the filesystem tree. It's essentially aliasing one path to another. Since the kernel needs to track all mounted filesystems (including bind mounts), they all get recorded in `/proc/mounts`.

This meant the container was essentially exposing its own flag location through standard Linux filesystem metadata.

> **Additional Note:** You could also use `/proc/self/mountinfo` for even more detailed information. The main difference is that `/proc/mounts` provides a simpler, traditional view of mounted filesystems, while `/proc/self/mountinfo` gives you more comprehensive kernel-level details including mount IDs and propagation settings.

## Getting the Flag

Once I had the exact path, retrieving the flag was straightforward:

```bash
curl "http://server/view?filename=/flag-VenUXnNXjh9MJxOH6m8xHvAR2oG9cmmG.txt"
```

And just like that, the flag appeared:

```
SEKAI{!s-+h1s_3VEN_<all3d_a_cv3}
```

Success!

## Alternative Solution - The Intended Path

After solving it, I checked the official writeup and discovered there was actually a much more complex intended solution that I had completely missed.

Remember that `debug=True` setting I glossed over? Turns out that was the key to the intended exploit chain.

Here's how the intended solution worked:

1. **Information Gathering via LFI**
    
    Using the file read vulnerability, you could extract specific system information:
    - MAC address from `/sys/class/net/eth0/address`
    - Boot ID from `/proc/sys/kernel/random/boot_id`
    - Other system identifiers

2. **Werkzeug PIN Generation**
    
    Flask's debug console is protected by a PIN that's generated using specific system values. By collecting the "public bits" (like username, module name, and app path) and "private bits" (MAC address and boot ID), you could recreate Werkzeug's PIN generation algorithm and compute the correct PIN.

3. **Bypassing Access Restrictions**
    
    The debug console typically restricts access to localhost only. However, by manipulating the `Host` header to `127.0.0.1`, you could trick the application into treating your request as local, which would expose a `SECRET` value from the `/console` endpoint.

4. **Console Authentication**
    
    With both the calculated **PIN** and the leaked **SECRET**, you could call the `pinauth` endpoint to obtain a valid session cookie for the debug console.

5. **Achieving Remote Code Execution**
    
    Once authenticated to the debug console, you'd have full Python code execution capabilities, allowing you to run arbitrary commands and read the flag directly.

The complete intended exploit chain was: **LFI → System info collection → PIN calculation → SECRET extraction → Console authentication → RCE → Flag retrieval**.

You can find the official solution script [here](https://github.com/project-sekai-ctf/sekaictf-2025/blob/main/web/my-flask-app/solution/solve.py).

In retrospect, I completely underestimated the significance of that `debug=True` line. It was hiding in plain sight the entire time.

## Closing Thoughts

What made *My Flask App* memorable for me was how it subverted typical CTF patterns. On the surface, it looked like just another Flask LFI challenge, but the randomized flag path added an interesting layer that forced you to think beyond simple path traversal.

I particularly appreciated that there were two valid approaches:

- **My solution** - exploiting the bind-mount configuration leak through `/proc/mounts` to discover the randomized filename
- **The intended solution** - leveraging `debug=True` to reconstruct the Werkzeug PIN and gain RCE through the Flask debugger

Both approaches highlighted an important lesson: even simple vulnerabilities like arbitrary file reads or forgotten debug flags can lead to complete system compromise when combined with deep knowledge of the underlying platform.

What I took away from this challenge wasn't about memorizing payloads or following scripts — it was about careful observation, understanding how systems work at a fundamental level, and using that knowledge to find creative solutions. Sometimes the simplest path forward is the one hidden in the system's own design.