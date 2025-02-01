# Security Policy

## Supported Versions

Because our project is still in its early stages, we only provide security fixes for the most recent release:

| Version | Supported |
| ------- | --------- |
| 0.0.x   | ✅        |
| < 0.0.1 | ❌        |

---

## Reporting a Vulnerability

We take Edwin's security very seriously. If you discover a vulnerability, please let us know by following these steps:

### Private Reporting Process

1. **Do Not** create a public GitHub issue about the vulnerability.
2. Send an email to [security@edwin.finance](mailto:security@edwin.finance) with:
    - A clear description of the issue
    - Steps to reproduce
    - Potential impact
    - Any proposed mitigations or fixes

### What to Expect

- **Initial Response (within 48 hours):** We will confirm we've received your report.
- **Progress Updates (every five business days):** We'll inform you of any developments.
- **Resolution Timeline (aim: 15 days):** We strive to address critical issues promptly.
- **Disclosure:** We coordinate with you on an appropriate public disclosure timeline.

---

## Security Best Practices

### For Contributors

#### API Keys and Secrets

- Never commit passwords, tokens, or other secrets to the repository.
- Use environment variables as outlined in our secrets management documentation.
- Immediately rotate any exposed credentials.

#### Dependencies

- Regularly update all dependencies.
- Stay informed of security advisories related to your packages.
- Use `pnpm audit` to detect known vulnerabilities.

#### Code Review

- All changes must be made through pull requests.
- Sensitive changes require additional review.
- Always enable branch protection settings on critical branches.

### For Users

#### Environment Setup

- Adhere to our secrets management guide for secure configuration.
- Use separate API keys for production and development.
- Rotate all credentials periodically.

#### Model Provider Security

- Apply rate limiting on API calls where possible.
- Monitor usage to detect unusual behavior.
- Ensure proper authentication for any publicly exposed endpoints.

#### Platform Integration

- Use distinct bot tokens for different environments.
- Limit platform API permissions to only what's necessary.
- Conduct regular audits of access and permissions.

---

## Security Features

### Current Implementation

- Environment-variable-based secrets management.
- Type-safe API implementations.
- Automated dependency updates.
- Security checks integrated into our CI process.

### Planned Improvements

#### Q1 2025

- Expanded security-focused documentation.
- Automated vulnerability scanning tools.

---

## Vulnerability Disclosure Policy

We follow a coordinated disclosure approach:

1. The reporter submits the details of the vulnerability.
2. Our team verifies and assesses the report.
3. A fix is developed, reviewed, and tested.
4. We deploy the fix to supported versions.
5. Public disclosure occurs after 30 days or as agreed upon.

---

## Recognition

We appreciate the work of security researchers who help us improve. Anyone who reports a verified vulnerability will:

- Be acknowledged in our security credits (or remain anonymous upon request).
- Be listed in our security hall of fame.
- Potentially qualify for our upcoming bug bounty program.

---

## License Considerations

This project is released under the MIT License, which means:

- The software is provided "as is" with no warranties.
- Users are responsible for their security measures.
- Contributors grant a perpetual license for all submitted contributions.

---

## Contact

- **Security Issues:** [security@edwin.finance](mailto:security@edwin.finance)
- **General Inquiries:** Join our community on Discord
- **Security Updates:** Check our official security advisory page
