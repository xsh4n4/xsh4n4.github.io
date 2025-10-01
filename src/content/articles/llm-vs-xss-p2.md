---
title: "Detecting XSS Attacks with LLM Agents: Stored"
excerpt: "LMMs vs XSS Part-2"
path: /articles/llm-vs-xss-p2/
categories: [articles]
tags: [cybersecurity, llm, xss, ai]
date: 2023-10-07
last_modified_at: 2023-10-07T09:59:14
comments: true
featured: true
toc: true
---


## Stored XSS: The Most Dangerous XSS Type and How LLM Agents Can Detect It

Cross-Site Scripting (XSS) vulnerabilities have long been a major threat in web security. Among its types — reflected, DOM-based, and stored — **Stored XSS** is the most severe and persistent. In this post (Part 3 of my series), we’ll explore Stored XSS in detail and see how LLM (Large Language Model) agents can help detect it effectively.


## What is Stored XSS?

Unlike **Reflected XSS** (which is temporary and requires a malicious link) or **DOM-based XSS** (which is purely client-side), **Stored XSS** involves injecting a payload that gets saved on the server — typically in a database — and served to every user who visits the affected page.

### Common storage points include:
1. Comments or forum posts  
2. User profile fields  
3. Product reviews  
4. Support tickets  

Once stored, the script executes each time the data is rendered, making it a **long-term and scalable attack vector**.


## Why is Stored XSS Dangerous?

1. **Persistence**: The payload stays on the site until manually removed.  
2. **Wide impact**: Every visitor to the page becomes a victim.  
3. **Stealth**: Users don’t need to click a special link.  

Attackers can:
- Steal session tokens  
- Deface content  
- Perform actions on behalf of other users  


## Designing an LLM Agent to Detect Stored XSS

LLM-powered agents can help detect Stored XSS vulnerabilities by simulating how an attacker would submit and then observe stored payloads in an application.  

### How such an agent could work:

#### 1. Identify Persistent Input Vectors
The agent maps input fields that are likely to store data on the backend:
- Comments, message boards  
- Profile bios  
- Product descriptions  

#### 2. Generate Malicious Payloads
The LLM suggests and generates payloads tailored for different contexts.

#### 3. Submit Payload
The agent submits these payloads via **HTTP POST** or **PUT** requests.

#### 4. Trigger the Rendered View
After storing the payload, the agent visits the page where this input is displayed (e.g., a public comment section or a user profile page).

#### 5. Analyze the Output
The agent (using LLM reasoning) checks if the payload is reflected unescaped in the HTML source or executed in the browser.

#### 6. Report Vulnerability
If the payload is present and would execute, the agent flags it and generates a detailed report with:
- Affected endpoint  
- Payload used  
- Suggested mitigation  

## Sample Workflow

**Simplified Flow:**  


## How to Mitigate Stored XSS

- Escape output when rendering user content  
- Use **Content Security Policy (CSP)**  
- Sanitize inputs at both client and server levels  
- Employ frameworks with automatic escaping (e.g., React, Angular)  


## Summary

Stored XSS is the **most dangerous** form of cross-site scripting because the malicious script is saved on the server (e.g., in comments or profiles) and served to all users who view that data later.  

It is persistent, affects many users, and can silently steal data or take over sessions.  

Using **LLM agents**, we can detect Stored XSS by:  
1. Identifying persistent input points  
2. Injecting test payloads  
3. Visiting pages to see if payloads are executed  
4. Reporting any vulnerabilities found  

**Mitigation**: Always sanitize input, escape output, and apply strong Content Security Policies.  


Be ready to learn about **DOM-Based XSS** in our next blog!

