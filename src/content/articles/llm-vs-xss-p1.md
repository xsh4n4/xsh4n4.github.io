---
title: "Detecting XSS Attacks with LLM Agents: Reflected"
excerpt: "LLMs vs XSS Part-1"
path: /articles/llm-vs-xss-p1/
categories: [articles]
tags: [cybersecurity, llm, xss, ai]
date: 2023-07-14
last_modified_at: 2023-07-14T20:49:14
comments: true
toc: true
---


### What is LLM?

A large language model (LLM) is a type of machine learning model designed for natural language processing (NLP) tasks such as language generation, text translation, speech recognition, and sentiment analysis.

**Examples:** Deepseek r1, openai o1, GPT, BERT, etc.

### What are LLM agents?

LLM agents are advanced AI systems designed for creating complex text that needs sequential reasoning. They can think ahead, remember past conversations, and use different tools to adjust their responses based on the situation and style needed.

**Examples:** AutoGPT, ChemCrow, etc.

## XSS Vulnerabilities

Cross-site scripting (XSS) vulnerabilities are a common type of web security issue that allow attackers to inject malicious code into a website. This can lead to serious consequences for the user, such as having their data stolen or their account deletion, malware infection, etc.

### There are three main types of XSS attacks:

- **Reflected XSS** - where the malicious script comes from the current HTTP request.
- **Stored XSS** - where the malicious script comes from the website's database.
- **DOM-based XSS** - where the vulnerability exists in client-side code rather than server-side code.

## LLM Agent to Detect Reflected XSS

The task is to design an agent that uses an LLM to detect XSS vulnerabilities in a web application.

### What am I going to choose?

Reflected XSS is common and easier to test for since it involves input being immediately reflected in the response. Stored XSS requires persistence, which could complicate testing. DOM-Based might be trickier because it's client-side.

**Let's go with Reflected XSS for simplicity.**

Let's assume the LLM has the intelligence of a high school student but interacts only via text. So, the agent needs to guide the LLM through text-based interactions to simulate a security researcher's approach.

First, I need to outline how a security researcher detects Reflected XSS. They typically look for places where user input is reflected in the response. For example, search forms, URL parameters, etc. They test by injecting various payloads and see if the script executes.

The LLM needs to mimic this process but through text interaction. Since the agent can't actually execute code or see the web page, maybe the LLM has to generate test payloads, analyze responses, and determine if the payload was executed or if there's a vulnerability.

### So the pipeline could be something like:

#### 1. Identify input vectors

The LLM might need to analyze the web page's HTML to find forms, URL parameters, etc. Wait, but the LLM only interacts through text. Maybe the agent first crawls the web app to collect input points, then uses the LLM to prioritize which inputs to test based on context.

#### 2. Generate test payloads

The LLM creates various XSS payloads tailored to Reflected XSS. These could be simple script tags, event handlers, etc. It should consider different contexts (HTML, JavaScript, attributes) and encoding methods.

#### 3. Send requests with payloads and test

The agent would send these payloads into the identified parameters and capture HTTP requests.

#### 4. Analyze responses

The LLM receives the text of the HTTP response and checks if the payload was executed or reflected without proper escaping/sanitization. For example, if the script tag appears in the response as submitted, it might indicate a vulnerability.

#### 5. Determine vulnerability

Based on the analysis, the LLM concludes whether the parameter is vulnerable or not and generates a report.

Thus, the agent's pipeline combines automated web crawling/testing tools with the LLM's analytical capabilities to guide the detection process. The LLM acts as the brain that decides what to test, interprets results, and concludes about vulnerabilities.

### Example Workflow

**Input:** `target_url = "https://example.com/search?q=test"`

**Step 1:** LLM identifies `q` as an input parameter.

**Step 2:**
- Sends a benign probe (ABC) to `q`.
- Checks if ABC is reflected in the response.
- If reflected, generates XSS payloads like `<script>alert(1)</script>`.
- Sends each payload and captures the response.
- Analyzes the response to confirm if the payload executed.

**Step 3:** Generates a report listing vulnerabilities.

### Flow Diagram of a LLM Agent

This flowchart illustrates how an LLM agent works. It begins by identifying input parameters from a target URL, sending benign probes (can be known as security audits), and checking for reflection.

If reflection is detected, it generates and injects payloads, capturing and analyzing responses using LLMs. If a vulnerability is confirmed, findings are reported. This structured process helps automate security testing, enhancing efficiency in detecting web application vulnerabilities such as XSS.

### Simple Pseudo Code Example

Let me show you a simple pseudo code of finding vulnerabilities after identifying the inputs:

```python
function detect_reflected_xss(target_url, parameters):
    for each parameter in parameters:
        # Send benign probe
        response = send_request(target_url, parameter, "ABC")
        
        if "ABC" in response:
            # Parameter reflects input
            for each payload in xss_payloads:
                test_response = send_request(target_url, parameter, payload)
                
                # Use LLM to analyze response
                vulnerability = llm_analyze(test_response, payload)
                
                if vulnerability:
                    report_vulnerability(parameter, payload)
                    break
```

## Let's Dive In...

### How does the LLM do it through text?

The agent is structured to have steps where it first identifies possible parameters, then iterates through payloads, sends each one, and then the LLM evaluates each response. The key is that the LLM isn't executing code but guiding the process via text-based analysis.

So the LLM is the brain that tells the agent what to do next. The agent would be a program that uses the LLM's outputs to perform actions like generating payloads, making HTTP requests, and analyzing responses.

### How does the agent interact with the web app?

It needs to send HTTP requests, handle sessions, manage cookies, etc. The agent has a module for HTTP interaction, possibly using tools like curl or headless browsers, while the LLM handles the analysis parts.

### Prompt Examples

**Example prompts the LLM might process:**

```text
Prompt: "Analyze this HTTP response. Does it contain the unescaped payload '<script>alert(1)</script>'?"

Prompt: "Generate 5 XSS payloads suitable for testing a search parameter in an HTML context."

Prompt: "Based on the response containing '<script>alert(1)</script>' in the body without encoding, is this parameter vulnerable to XSS?"
```

---

**Learn about Stored XSS and DOM-Based XSS attacks in my next blog.**

## Summary

### What is Reflected XSS?

Reflected XSS is a type of Cross-Site Scripting attack where the malicious script is embedded into a URL or form input and is immediately "reflected" back in the server's response — without ever being stored. This makes it temporary, but still highly dangerous.

It's often exploited through:
- Search bars
- URL query parameters
- Login error messages
- Contact forms

When a user clicks a crafted malicious link or submits a form, the browser executes the attacker's script, which may steal cookies, session tokens, or redirect users to phishing pages.

### Using LLM Agents to Detect Reflected XSS

An LLM-powered agent simulates the role of a security researcher through a smart pipeline:

1. **Identifies** user input points in forms or URLs.
2. **Generates** test payloads like `<script>alert(1)</script>`.
3. **Sends** HTTP requests with payloads.
4. **Analyzes** server responses to check if payloads are reflected unescaped.
5. **Confirms** vulnerability if the script appears or would execute in the browser.

By leveraging an LLM's reasoning ability, this approach automates the logic, analysis, and decision-making process — making web vulnerability detection smarter and faster.