---
title: "Detecting XSS Attacks with LLM Agents: DOM-Based"
excerpt: "LLMs vs XSS Part-3"
path: /articles/llm-vs-xss-p3/
categories: [articles]
tags: [cybersecurity, llm, xss, ai]
date: 2024-01-06
last_modified_at: 2024-01-06T09:59:14-05:00
comments: true
featured: true
toc: true
---


We have talked about Stored XSS and Reflected XSS in our previous Blogs. Now, Let me design the LLM agent to detect DOM-Based XSS via Prototype Pollution & postMessage Exploitation.

Unlike reflected XSS, which comes from the server's response, DOM-Based XSS occurs entirely on the client side when JavaScript dynamically modifies the DOM based on untrusted input. Two critical attacks are:

Prototype Pollution: A security vulnerability where an attacker manipulates the core properties of JavaScript objects. This allows attackers to inject malicious code, potentially leading to Cross-Site Scripting (XSS) attacks and data damage.

postMessage Exploitation: A security vulnerability where an attacker sends malicious messages to a website or application using the window.postMessage API. If the website doesn't properly check the message's origin or content, the attacker's malicious script can be executed, potentially stealing sensitive data or taking control of the user's session.

The agent's primary role is to interact with the web application through text-based commands, identify potential DOM-Based XSS vulnerabilities, and provide detailed reports on findings. It uses the LLM's reasoning capabilities to analyze JavaScript execution flows, detect unsafe data sinks, and simulate exploit scenarios.

I'm following the pipeline similar to Reflected XSS but DOM-based.

## 1. Identify Input Vectors

The agent begins by mapping the web application to identify input points that influence JavaScript execution. Steps include,

- Crawl the application and Extract all script files, inline JavaScript, and event handlers. Ex: window.location.search

- Locate sources of user input such as location.hash, document.URL, postMessage, and query parameters. Ex: element.innerHTML = location.search(detect sink)

- Search for functions like innerHTML, eval(), document.write(), and setTimeout() that may execute untrusted data.

Note: Direct insertion of untrusted input into the DOM.

## 2. Generate Test Payloads

The LLM can create various XSS payloads related to DOM-Based XSS. These payloads target different execution contexts (JavaScript objects, event handlers, and postMessage data).

Prototype Pollution Payload Example:

   ```
fetch("https://target.com?polluted=1", {body: JSON.stringify({"proto": {"toString" : "<script>alert(1)</script>"}})})
   ```

postMessage Exploitation Payload Example:

```window.postMessage("<script>alert(1)<script>", "*");```


## 3. Send Requests with Payloads and Test

The agent injects the generated payloads into identified input parameters and checks the application's response in real time. Execution Steps include,

- Inject prototype pollution payloads and track changes in JavaScript objects.

- Send malicious postMessage payloads and observe how they are handled.

- Capture and analyze DOM modifications to detect unsafe script execution.

## 4. Analyze JavaScript Execution & DOM Changes

DOM-Based XSS detection does not depend on HTTP responses but requires real-time monitoring of JavaScript execution.

Unsafe Assignments like Input directly assigned to innerHTML, outerHTML, or eval(), usage of toString and Insecure data flow between iframes (postMessage Reflection) should be analyzed.

## 5. Determine Vulnerability and Generate Report

Based on its findings, the agent concludes whether a parameter is vulnerable or not and generates a security report.

By using an LLM's ability to analyze JavaScript execution, detect prototype pollution, and identify insecure postMessage handlers, this agent provides a good approach to detecting DOM-Based XSS vulnerabilities.

## Example Workflow:

Input: target_url = "https://example.com/app"

Step 1:

LLM identifies window.location.hash and postMessage as input sources.

Step 2:

- Sends a benign probe (ABC) to test reflection.

- If reflected, generates XSS payloads such as 
```<script>alert(1)</script>.```

- Sends each payload and captures changes to the DOM.

- Analyzes whether the payload executed.

Step 3:

Generates a report listing vulnerabilities.

## Flow Diagram of LLM Agent (DOM-based XSS)

This flowchart illustrates the process of detecting and exploiting DOM-based Cross-Site Scripting (XSS) vulnerabilities. It begins by identifying the target URL, extracting JavaScript, and locating user input sources. Unsafe JavaScript sinks are detected, and XSS payloads are generated and injected. DOM changes are analyzed to confirm exploits. Two attack scenarios - Prototype Pollution and postMessage Exploitation - are explored, leading to malicious property injection, JavaScript monitoring, and XSS confirmation with recommendations for fixes.

## Pseudo code of workflow

Stay tuned for more blogs!