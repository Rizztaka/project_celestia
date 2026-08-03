# **# ADR 0002: Stateless JWT Authentication and Security Patterns (Milestone 1B)**



**Status:** Accepted  

**Date:** 2026-08-02  

**Project Architect:** Lead Engineer  

**Project Owner:** Rizztaka  



\---



## **Context**



Project Celestia required a secure authentication mechanism for Phase 1. The authentication system needed to integrate seamlessly with the existing Modular Monolith architecture, ensuring that the `users` domain and the `auth` domain remain decoupled while adhering to strict Domain-Driven Design (DDD) principles. 



Furthermore, we needed to establish core security postures against common OWASP vulnerabilities (e.g., user enumeration, password brute-forcing, and JWT payload leakage) without over-engineering the infrastructure before it is strictly necessary (e.g., deploying Redis for session invalidation).



\---



## **Decision**



We have implemented a stateless authentication architecture utilizing JSON Web Tokens (JWT) and strict security boundaries:



* **Stateless JWT Access Tokens:** Authentication is handled entirely via short-lived JWTs passed in the `Authorization: Bearer <token>` header. The token payload (`sub`) contains only the user's UUID.



* **Pure JavaScript Hashing (`bcryptjs`):** We selected `bcryptjs` over the native `bcrypt` library to hash passwords with a cost factor of 12. 



* **Strict Anti-Enumeration Design:** The `AuthService` login method is designed to return identical, generic error messages ("Invalid email or password.") and identical HTTP 401 status codes for both "user not found" and "incorrect password" scenarios.



* **Separation of Entity Ownership:** The `AuthService` handles authentication orchestration (hashing, token generation), but strictly delegates the actual persistence and uniqueness enforcement of user records to the `UserService` public interface.



* **Safe Return Types:** We instituted a `SafeUser` type (`Omit<User, "password">`) within the `users` domain. The `getUserById` service method explicitly strips the password hash before returning the entity, ensuring passwords never leak to API controllers or external consumers.



\---



## **Alternatives Considered**



* **Stateful Sessions (Redis / Database):** Rejected for Milestone 1B to minimize infrastructure complexity. While stateful sessions allow for immediate token revocation, the operational overhead of managing a Redis cache is unnecessary for the current project phase.



* **Native `bcrypt` Library:** Rejected because native C++ bindings frequently cause compilation failures across different developer environments and CI pipelines. `bcryptjs` is slightly slower but guarantees cross-platform reliability.



* **Refresh Tokens:** Rejected for the initial implementation to keep the authentication flow simple. Short-lived access tokens provide sufficient security for early development without the complexity of managing rotation families and reuse detection.



* **Combining Auth and User Domains:** Rejected. Mixing authentication orchestration (passwords, tokens) with core user management violates domain boundaries and creates tightly coupled, difficult-to-maintain code.



\---



## **Consequences**



### **Positive**



* **Infrastructure Simplicity:** The API remains completely stateless. We do not need a distributed cache or session store to scale horizontally.



* **Security Hardening:** The system is inherently protected against email enumeration attacks, and developers cannot accidentally leak password hashes because the domain services strip them out by design.



* **Platform Reliability:** By using `bcryptjs`, new developers can clone and run the project immediately without troubleshooting native Node-GYP build toolchains.



### **Negative**



* **Inability to Revoke Tokens:** Because the JWTs are stateless, there is currently no way to force a logout or revoke a token before its natural expiration. 



* **Token Expiry UX:** Without refresh tokens, users will be abruptly logged out when their access token expires, requiring a full re-authentication.



\---



## **Future Considerations**



* **Refresh Token Rotation:** As the application moves toward Phase 6 (Advanced Systems) and production readiness, we will introduce opaque refresh tokens stored in the database to improve user experience while maintaining security.



* **Token Blocklisting:** We will eventually introduce a Redis-based blocklist to allow for immediate invalidation of compromised or logged-out access tokens.



* **Rate Limiting:** To prevent brute-force attacks on the `/login` endpoint, an IP-based rate limiter will be necessary once the application is exposed to the public internet.

