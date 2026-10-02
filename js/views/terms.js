export function render_terms() {
    return `
<main class="w-full max-w-[1080px] mx-auto px-4 md:px-8 py-12 animate-fade-in text-on-surface">
    <!-- Header -->
    <div class="mb-10 pb-6 border-b border-white/5">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-mono font-bold uppercase tracking-widest mb-3">
            <span class="material-symbols-outlined text-[14px]">gavel</span>
            Legal Terms &amp; Conditions
        </div>
        <h1 class="text-3xl md:text-5xl font-display font-extrabold text-on-surface tracking-tight">Terms &amp; Conditions</h1>
        <p class="text-on-surface-variant text-sm md:text-base mt-2 font-medium">
            Effective Date: 02 October 2026 | Last Updated: 02 October 2026
        </p>
    </div>

    <!-- Quick Navigation / TOC Summary Card -->
    <div class="glass-panel p-6 rounded-2xl border border-white/5 mb-8 bg-surface-container-low/40 backdrop-blur-md">
        <h3 class="text-sm font-bold uppercase tracking-wider text-on-surface mb-3 flex items-center gap-2">
            <span class="material-symbols-outlined text-primary text-[18px]">toc</span> Table of Contents
        </h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs text-on-surface-variant">
            <a href="#term-definitions" class="hover:text-primary transition-colors flex items-center gap-1.5"><span class="w-1.5 h-1.5 rounded-full bg-primary"></span> 1. Definitions</a>
            <a href="#term-acceptance" class="hover:text-primary transition-colors flex items-center gap-1.5"><span class="w-1.5 h-1.5 rounded-full bg-primary"></span> 2. Acceptance of Terms</a>
            <a href="#term-eligibility" class="hover:text-primary transition-colors flex items-center gap-1.5"><span class="w-1.5 h-1.5 rounded-full bg-primary"></span> 3. Eligibility and Accounts</a>
            <a href="#term-projects" class="hover:text-primary transition-colors flex items-center gap-1.5"><span class="w-1.5 h-1.5 rounded-full bg-secondary"></span> 4. Collaborative Projects</a>
            <a href="#term-content-ip" class="hover:text-primary transition-colors flex items-center gap-1.5"><span class="w-1.5 h-1.5 rounded-full bg-secondary"></span> 5. User Content &amp; IP</a>
            <a href="#term-opensource" class="hover:text-primary transition-colors flex items-center gap-1.5"><span class="w-1.5 h-1.5 rounded-full bg-secondary"></span> 6. Open-Source Licenses</a>
            <a href="#term-prohibited" class="hover:text-primary transition-colors flex items-center gap-1.5"><span class="w-1.5 h-1.5 rounded-full bg-error"></span> 7. Prohibited Use</a>
            <a href="#term-third-party" class="hover:text-primary transition-colors flex items-center gap-1.5"><span class="w-1.5 h-1.5 rounded-full bg-primary"></span> 8. Third-Party Services</a>
            <a href="#term-security" class="hover:text-primary transition-colors flex items-center gap-1.5"><span class="w-1.5 h-1.5 rounded-full bg-tertiary"></span> 9. Security &amp; Disclosure</a>
            <a href="#term-availability" class="hover:text-primary transition-colors flex items-center gap-1.5"><span class="w-1.5 h-1.5 rounded-full bg-primary"></span> 10. Service Availability</a>
            <a href="#term-privacy" class="hover:text-primary transition-colors flex items-center gap-1.5"><span class="w-1.5 h-1.5 rounded-full bg-secondary"></span> 11. Privacy Protection</a>
            <a href="#term-disclaimers" class="hover:text-primary transition-colors flex items-center gap-1.5"><span class="w-1.5 h-1.5 rounded-full bg-primary"></span> 12. Disclaimers</a>
            <a href="#term-liability" class="hover:text-primary transition-colors flex items-center gap-1.5"><span class="w-1.5 h-1.5 rounded-full bg-primary"></span> 13. Limitation of Liability</a>
            <a href="#term-indemnification" class="hover:text-primary transition-colors flex items-center gap-1.5"><span class="w-1.5 h-1.5 rounded-full bg-primary"></span> 14. User Indemnification</a>
            <a href="#term-termination" class="hover:text-primary transition-colors flex items-center gap-1.5"><span class="w-1.5 h-1.5 rounded-full bg-error"></span> 15. Suspension &amp; Termination</a>
            <a href="#term-governing-law" class="hover:text-primary transition-colors flex items-center gap-1.5"><span class="w-1.5 h-1.5 rounded-full bg-primary"></span> 16. Governing Law</a>
            <a href="#term-severability" class="hover:text-primary transition-colors flex items-center gap-1.5"><span class="w-1.5 h-1.5 rounded-full bg-primary"></span> 17. Severability</a>
            <a href="#term-contact" class="hover:text-primary transition-colors flex items-center gap-1.5"><span class="w-1.5 h-1.5 rounded-full bg-secondary"></span> 18. Contact Information</a>
        </div>
    </div>

    <!-- Content Sections -->
    <div class="glass-panel p-6 md:p-12 rounded-3xl border border-white/5 space-y-10 leading-relaxed text-sm md:text-base text-on-surface-variant backdrop-blur-xl">
        
        <!-- 1. Definitions -->
        <section id="term-definitions" class="space-y-4 scroll-mt-24">
            <h2 class="text-xl md:text-2xl font-bold text-on-surface flex items-center gap-2.5">
                <span class="w-8 h-8 rounded-xl bg-primary/15 text-primary flex items-center justify-center font-mono text-sm font-bold">01</span>
                Definitions
            </h2>
            <div class="space-y-3 pl-0 sm:pl-10 text-on-surface-variant">
                <p>Throughout these Terms and Conditions ("Terms"), the following defined terms apply:</p>
                <ul class="space-y-2 list-disc pl-5">
                    <li><strong class="text-on-surface">"CodeCollab"</strong>, <strong class="text-on-surface">"Platform"</strong>, <strong class="text-on-surface">"We"</strong>, <strong class="text-on-surface">"Our"</strong>, or <strong class="text-on-surface">"Us"</strong> refers to the CodeCollab collaborative open-source engineering platform, website, application interfaces, and associated services.</li>
                    <li><strong class="text-on-surface">"User"</strong> or <strong class="text-on-surface">"You"</strong> refers to any individual, developer, contributor, maintainer, or entity accessing or using the Platform.</li>
                    <li><strong class="text-on-surface">"Project"</strong> refers to any collaborative software repository, codebase showcase, tool, or engineering initiative created, registered, or hosted on the Platform.</li>
                    <li><strong class="text-on-surface">"User Content"</strong> includes all project descriptions, README files, issues, comments, profile information, skills, portfolio links, and text submitted to or published on CodeCollab.</li>
                    <li><strong class="text-on-surface">"Contributor"</strong> means any user who opens issues, submits code, provides reviews, upvotes projects, or participates in teams or matchmaking.</li>
                    <li><strong class="text-on-surface">"Maintainer"</strong> or <strong class="text-on-surface">"Project Owner"</strong> means the authenticated user who created, registered, or has administrative privileges over a Project on CodeCollab.</li>
                </ul>
            </div>
        </section>

        <!-- 2. Acceptance of Terms -->
        <section id="term-acceptance" class="space-y-4 scroll-mt-24 pt-6 border-t border-white/5">
            <h2 class="text-xl md:text-2xl font-bold text-on-surface flex items-center gap-2.5">
                <span class="w-8 h-8 rounded-xl bg-primary/15 text-primary flex items-center justify-center font-mono text-sm font-bold">02</span>
                Acceptance of Terms
            </h2>
            <div class="space-y-3 pl-0 sm:pl-10 text-on-surface-variant">
                <p>
                    By browsing, accessing, registering an account on, creating projects on, or otherwise using CodeCollab, you confirm that you have read, understood, and agreed to be legally bound by these Terms and our integrated <a href="#privacy" class="text-primary hover:underline font-medium">Privacy Policy</a>.
                </p>
                <p>
                    If you do not agree to all provisions contained within these Terms, you must immediately discontinue your use of the Platform and any associated APIs or services.
                </p>
            </div>
        </section>

        <!-- 3. Eligibility and Accounts -->
        <section id="term-eligibility" class="space-y-4 scroll-mt-24 pt-6 border-t border-white/5">
            <h2 class="text-xl md:text-2xl font-bold text-on-surface flex items-center gap-2.5">
                <span class="w-8 h-8 rounded-xl bg-primary/15 text-primary flex items-center justify-center font-mono text-sm font-bold">03</span>
                Eligibility and Accounts
            </h2>
            <div class="space-y-3 pl-0 sm:pl-10 text-on-surface-variant">
                <p>
                    To create an account and participate in collaborative activities, you must have the legal capacity to enter into a binding agreement under applicable laws. If you are using CodeCollab on behalf of an organization, guild, or team, you represent that you possess the necessary authorization to bind that entity to these Terms.
                </p>
                <ul class="space-y-2 list-disc pl-5">
                    <li><strong class="text-on-surface">Account Accuracy:</strong> You agree to provide accurate, current, and complete information during registration and keep your developer profile up to date.</li>
                    <li><strong class="text-on-surface">Credential Confidentiality:</strong> You are solely responsible for safeguarding the credentials, passwords, and active session cookies used to access your account. CodeCollab employs secure cryptographic hashing (bcrypt) and session isolation, but you must notify us immediately at <span class="font-mono text-on-surface">scriptedbydev@gmail.com</span> upon discovering any unauthorized access.</li>
                    <li><strong class="text-on-surface">Strict Contact Privacy:</strong> Under CodeCollab's zero-exposure architecture, personal email addresses and contact phone numbers provided during registration are treated as strictly confidential internal credentials and are never rendered on public developer cards or registries.</li>
                </ul>
            </div>
        </section>

        <!-- 4. Collaborative Projects -->
        <section id="term-projects" class="space-y-4 scroll-mt-24 pt-6 border-t border-white/5">
            <h2 class="text-xl md:text-2xl font-bold text-on-surface flex items-center gap-2.5">
                <span class="w-8 h-8 rounded-xl bg-secondary/15 text-secondary flex items-center justify-center font-mono text-sm font-bold">04</span>
                Collaborative Projects
            </h2>
            <div class="space-y-3 pl-0 sm:pl-10 text-on-surface-variant">
                <p>
                    CodeCollab provides features that allow project owners to register software initiatives, publish markdown README documentation, track development completion percentages, declare technical requirements, organize issues, recruit team members, and receive community upvotes.
                </p>
                <ul class="space-y-2 list-disc pl-5">
                    <li><strong class="text-on-surface">Maintainer Responsibilities:</strong> Maintainers are responsible for defining the project scope, managing contribution standards, ensuring code quality, and accurately designating project status and license specifications.</li>
                    <li><strong class="text-on-surface">Project Information:</strong> Information published within project descriptions and READMEs must accurately reflect the software and repository without deceptive claims, fraudulent solicitations, or disguised malicious code.</li>
                    <li><strong class="text-on-surface">Upvotes &amp; Interactions:</strong> Upvoting, bookmarking, and community ratings are designed to foster merit-based discovery. Any artificial manipulation, automated botting, or vote collusion is strictly prohibited.</li>
                </ul>
            </div>
        </section>

        <!-- 5. User Content and Intellectual Property -->
        <section id="term-content-ip" class="space-y-4 scroll-mt-24 pt-6 border-t border-white/5">
            <h2 class="text-xl md:text-2xl font-bold text-on-surface flex items-center gap-2.5">
                <span class="w-8 h-8 rounded-xl bg-secondary/15 text-secondary flex items-center justify-center font-mono text-sm font-bold">05</span>
                User Content and Intellectual Property
            </h2>
            <div class="space-y-3 pl-0 sm:pl-10 text-on-surface-variant">
                <p>
                    <strong class="text-on-surface">You retain full ownership and copyright of all original User Content, source code, and assets that you create and submit to CodeCollab.</strong>
                </p>
                <p>
                    By submitting or publishing User Content on the Platform, you grant CodeCollab a worldwide, non-exclusive, royalty-free, transferable license solely to host, cache, store, reproduce, index, format, and display your User Content as necessary to operate, maintain, protect, and improve the Platform and its collaborative features.
                </p>
                <p>
                    You represent and warrant that you own or have obtained all necessary licenses, permissions, and rights to submit your User Content, and that your content does not infringe or violate any third-party patent, copyright, trademark, trade secret, or privacy right.
                </p>
            </div>
        </section>

        <!-- 6. Open-Source Projects and Licenses -->
        <section id="term-opensource" class="space-y-4 scroll-mt-24 pt-6 border-t border-white/5">
            <h2 class="text-xl md:text-2xl font-bold text-on-surface flex items-center gap-2.5">
                <span class="w-8 h-8 rounded-xl bg-secondary/15 text-secondary flex items-center justify-center font-mono text-sm font-bold">06</span>
                Open-Source Projects and Licenses
            </h2>
            <div class="space-y-3 pl-0 sm:pl-10 text-on-surface-variant">
                <p>
                    CodeCollab strongly champions open-source software development. Projects registered on CodeCollab are typically governed by established open-source licenses (such as MIT, Apache 2.0, BSD, GNU GPL, MPL, or similar standardized licenses).
                </p>
                <ul class="space-y-2 list-disc pl-5">
                    <li><strong class="text-on-surface">License Independence:</strong> The specific open-source license attached to a project governs all code, contributions, and documentation within that repository. CodeCollab does not supersede, alter, or grant licenses on behalf of project owners.</li>
                    <li><strong class="text-on-surface">Contributor Compliance:</strong> When you contribute code, fixes, or documentation to an open-source project hosted or showcased on CodeCollab, you agree that your contribution is licensed under the specific license specified by that project.</li>
                </ul>
            </div>
        </section>

        <!-- 7. Prohibited Use -->
        <section id="term-prohibited" class="space-y-4 scroll-mt-24 pt-6 border-t border-white/5">
            <h2 class="text-xl md:text-2xl font-bold text-on-surface flex items-center gap-2.5">
                <span class="w-8 h-8 rounded-xl bg-error/15 text-error flex items-center justify-center font-mono text-sm font-bold">07</span>
                Prohibited Use
            </h2>
            <div class="space-y-3 pl-0 sm:pl-10 text-on-surface-variant">
                <p>You agree not to use CodeCollab for any unlawful, unauthorized, or harmful purpose. Specifically, you agree not to:</p>
                <ul class="space-y-2 list-disc pl-5">
                    <li>Deploy, distribute, or promote malware, spyware, backdoors, ransomware, or malicious scripts.</li>
                    <li>Harass, threaten, impersonate, stalk, defame, or discriminate against other developers, contributors, or maintainers.</li>
                    <li>Attempt to probe, scan, or breach the security, authentication, or integrity of CodeCollab servers, databases, or API endpoints.</li>
                    <li>Engage in automated scraping, excessive rate-limit abuse, denial-of-service (DoS/DDoS) attacks, or server resource exhaustion.</li>
                    <li>Publish spam, unsolicited commercial advertisements, phishing links, deceptive referral schemes, or fraudulent matchmaking posts.</li>
                    <li>Upload or distribute unauthorized proprietary or classified source code belonging to third parties without lawful consent.</li>
                </ul>
            </div>
        </section>

        <!-- 8. Third-Party Services -->
        <section id="term-third-party" class="space-y-4 scroll-mt-24 pt-6 border-t border-white/5">
            <h2 class="text-xl md:text-2xl font-bold text-on-surface flex items-center gap-2.5">
                <span class="w-8 h-8 rounded-xl bg-primary/15 text-primary flex items-center justify-center font-mono text-sm font-bold">08</span>
                Third-Party Services
            </h2>
            <div class="space-y-3 pl-0 sm:pl-10 text-on-surface-variant">
                <p>
                    CodeCollab integrates with and references third-party services and repositories to streamline engineering workflows. These include GitHub OAuth, GitHub repository links, Google OAuth, Discord community links, as well as ecosystem navigation partners (such as ATS Resume Check, Mental Health Check, and external resources).
                </p>
                <p>
                    CodeCollab does not own, operate, control, or endorse these third-party websites or services. Your interactions with third-party providers are governed exclusively by their respective terms of service and privacy policies. We disclaim any liability arising from your use of third-party platforms.
                </p>
            </div>
        </section>

        <!-- 9. Security and Responsible Disclosure -->
        <section id="term-security" class="space-y-4 scroll-mt-24 pt-6 border-t border-white/5">
            <h2 class="text-xl md:text-2xl font-bold text-on-surface flex items-center gap-2.5">
                <span class="w-8 h-8 rounded-xl bg-tertiary/15 text-tertiary flex items-center justify-center font-mono text-sm font-bold">09</span>
                Security and Responsible Disclosure
            </h2>
            <div class="space-y-3 pl-0 sm:pl-10 text-on-surface-variant">
                <p>
                    We prioritize Platform resilience and security. CodeCollab enforces cryptographic password hashing, strict cookie-based session verification, input sanitization, and structured data isolation.
                </p>
                <p>
                    If you identify a suspected security vulnerability, configuration flaw, or data leakage within CodeCollab, we request that you disclose it responsibly. Please submit your technical findings directly and confidentially to <strong class="text-on-surface font-mono">scriptedbydev@gmail.com</strong> prior to public disclosure. We commit to reviewing disclosures promptly and will not pursue legal action against security researchers acting in good faith.
                </p>
            </div>
        </section>

        <!-- 10. Service Availability and Changes -->
        <section id="term-availability" class="space-y-4 scroll-mt-24 pt-6 border-t border-white/5">
            <h2 class="text-xl md:text-2xl font-bold text-on-surface flex items-center gap-2.5">
                <span class="w-8 h-8 rounded-xl bg-primary/15 text-primary flex items-center justify-center font-mono text-sm font-bold">10</span>
                Service Availability and Changes
            </h2>
            <div class="space-y-3 pl-0 sm:pl-10 text-on-surface-variant">
                <p>
                    We continuously improve, adapt, and expand CodeCollab. We reserve the right to deploy updates, alter features, modify UI components, schedule maintenance, or temporarily suspend aspects of the Platform without prior liability.
                </p>
                <p>
                    While we strive for maximum uptime and reliable data storage, we do not warrant that service operations will be uninterrupted, error-free, or permanently continuous. You are encouraged to maintain independent backups of your source code and documentation.
                </p>
            </div>
        </section>

        <!-- 11. Privacy -->
        <section id="term-privacy" class="space-y-4 scroll-mt-24 pt-6 border-t border-white/5">
            <h2 class="text-xl md:text-2xl font-bold text-on-surface flex items-center gap-2.5">
                <span class="w-8 h-8 rounded-xl bg-secondary/15 text-secondary flex items-center justify-center font-mono text-sm font-bold">11</span>
                Privacy
            </h2>
            <div class="space-y-3 pl-0 sm:pl-10 text-on-surface-variant">
                <p>
                    Your privacy is fundamental to our platform design. All personal information provided to CodeCollab is handled in strict accordance with our <a href="#privacy" class="text-primary hover:underline font-medium">Privacy Policy</a>, which is incorporated by reference into these Terms.
                </p>
                <p>
                    Our zero-exposure architecture guarantees that personal contact emails and phone numbers are safeguarded from public developer directories, public search filters, and unauthorized third-party scrapers.
                </p>
            </div>
        </section>

        <!-- 12. Disclaimers -->
        <section id="term-disclaimers" class="space-y-4 scroll-mt-24 pt-6 border-t border-white/5">
            <h2 class="text-xl md:text-2xl font-bold text-on-surface flex items-center gap-2.5">
                <span class="w-8 h-8 rounded-xl bg-primary/15 text-primary flex items-center justify-center font-mono text-sm font-bold">12</span>
                Disclaimers
            </h2>
            <div class="space-y-3 pl-0 sm:pl-10 text-on-surface-variant">
                <p class="uppercase font-semibold text-xs tracking-wider text-on-surface">
                    "AS IS" and "AS AVAILABLE" Disclaimer
                </p>
                <p>
                    To the maximum extent permitted by applicable law, CodeCollab and its contributors provide the Platform, services, code samples, developer matchmaking, and APIs on an "AS IS" and "AS AVAILABLE" basis, without warranties of any kind, whether express, statutory, or implied.
                </p>
                <p>
                    We expressly disclaim all warranties of merchantability, fitness for a particular purpose, title, quiet enjoyment, and non-infringement. CodeCollab makes no warranty that code, libraries, or projects discovered via the Platform will be free from software bugs, security flaws, or performance issues.
                </p>
            </div>
        </section>

        <!-- 13. Limitation of Liability -->
        <section id="term-liability" class="space-y-4 scroll-mt-24 pt-6 border-t border-white/5">
            <h2 class="text-xl md:text-2xl font-bold text-on-surface flex items-center gap-2.5">
                <span class="w-8 h-8 rounded-xl bg-primary/15 text-primary flex items-center justify-center font-mono text-sm font-bold">13</span>
                Limitation of Liability
            </h2>
            <div class="space-y-3 pl-0 sm:pl-10 text-on-surface-variant">
                <p>
                    To the maximum extent permitted by applicable law, in no event shall CodeCollab, its maintainers, administrators, developers, or affiliates be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data corruption, loss of code, reputational harm, or system downtime arising out of or related to your access to or inability to use the Platform.
                </p>
                <p>
                    Where exclusion or limitation of liability for consequential or incidental damages is restricted by mandatory statutory law, our total aggregate liability shall be limited to the maximum extent permitted by applicable law, not exceeding fifty United States Dollars ($50.00 USD) or the amount you have paid to CodeCollab in the preceding twelve (12) months, whichever is greater.
                </p>
            </div>
        </section>

        <!-- 14. User Responsibility and Indemnification -->
        <section id="term-indemnification" class="space-y-4 scroll-mt-24 pt-6 border-t border-white/5">
            <h2 class="text-xl md:text-2xl font-bold text-on-surface flex items-center gap-2.5">
                <span class="w-8 h-8 rounded-xl bg-primary/15 text-primary flex items-center justify-center font-mono text-sm font-bold">14</span>
                User Responsibility and Indemnification
            </h2>
            <div class="space-y-3 pl-0 sm:pl-10 text-on-surface-variant">
                <p>
                    You agree to defend, indemnify, and hold harmless CodeCollab, its administrators, maintainers, contributors, and agents from and against any third-party claims, liabilities, damages, losses, and reasonable legal expenses arising out of or in any way connected with:
                </p>
                <ul class="space-y-2 list-disc pl-5">
                    <li>Your User Content, repositories, or documentation submitted to the Platform;</li>
                    <li>Your violation of these Terms or any applicable open-source license;</li>
                    <li>Your infringement of any intellectual property, privacy, or proprietary rights of any third party; or</li>
                    <li>Any willful misconduct or violation of applicable laws in connection with your account.</li>
                </ul>
            </div>
        </section>

        <!-- 15. Suspension and Termination -->
        <section id="term-termination" class="space-y-4 scroll-mt-24 pt-6 border-t border-white/5">
            <h2 class="text-xl md:text-2xl font-bold text-on-surface flex items-center gap-2.5">
                <span class="w-8 h-8 rounded-xl bg-error/15 text-error flex items-center justify-center font-mono text-sm font-bold">15</span>
                Suspension and Termination
            </h2>
            <div class="space-y-3 pl-0 sm:pl-10 text-on-surface-variant">
                <p>
                    We reserve the right, at our reasonable discretion, to suspend, disable, or terminate your account, remove any project listing, or restrict access to CodeCollab with or without notice if you violate these Terms, engage in fraudulent behavior, or pose a security risk to the community.
                </p>
                <p>
                    You may terminate your account at any time by ceasing all use of the Platform and submitting an account deletion request through your settings or by contacting <strong class="text-on-surface font-mono">scriptedbydev@gmail.com</strong>. Upon termination, provisions that by their nature should survive (including IP ownership, warranty disclaimers, liability limitations, and indemnification) will remain in full effect.
                </p>
            </div>
        </section>

        <!-- 16. Governing Law and Dispute Resolution -->
        <section id="term-governing-law" class="space-y-4 scroll-mt-24 pt-6 border-t border-white/5">
            <h2 class="text-xl md:text-2xl font-bold text-on-surface flex items-center gap-2.5">
                <span class="w-8 h-8 rounded-xl bg-primary/15 text-primary flex items-center justify-center font-mono text-sm font-bold">16</span>
                Governing Law and Dispute Resolution
            </h2>
            <div class="space-y-3 pl-0 sm:pl-10 text-on-surface-variant">
                <p>
                    These Terms, and any dispute or controversy arising out of or relating to CodeCollab, shall be governed by and construed in accordance with applicable statutory law, without giving effect to any conflict of law principles that would result in the application of the laws of another jurisdiction.
                </p>
                <p>
                    Before initiating formal litigation or arbitration, you and CodeCollab agree to engage in informal good-faith negotiation for at least thirty (30) days by contacting our administration at <strong class="text-on-surface font-mono">scriptedbydev@gmail.com</strong>. Mandatory consumer protections and non-waivable statutory rights provided by applicable consumer law remain intact.
                </p>
            </div>
        </section>

        <!-- 17. Severability -->
        <section id="term-severability" class="space-y-4 scroll-mt-24 pt-6 border-t border-white/5">
            <h2 class="text-xl md:text-2xl font-bold text-on-surface flex items-center gap-2.5">
                <span class="w-8 h-8 rounded-xl bg-primary/15 text-primary flex items-center justify-center font-mono text-sm font-bold">17</span>
                Severability
            </h2>
            <div class="space-y-3 pl-0 sm:pl-10 text-on-surface-variant">
                <p>
                    If any provision of these Terms is determined by a court of competent jurisdiction to be unlawful, void, or unenforceable, that provision shall be enforced to the maximum extent permissible and deemed severed from the remaining Terms, and the remaining provisions shall continue in full force and effect.
                </p>
            </div>
        </section>

        <!-- 18. Contact -->
        <section id="term-contact" class="space-y-4 scroll-mt-24 pt-6 border-t border-white/5">
            <h2 class="text-xl md:text-2xl font-bold text-on-surface flex items-center gap-2.5">
                <span class="w-8 h-8 rounded-xl bg-secondary/15 text-secondary flex items-center justify-center font-mono text-sm font-bold">18</span>
                Contact
            </h2>
            <div class="space-y-3 pl-0 sm:pl-10 text-on-surface-variant">
                <p>
                    If you have questions, inquiries, notices, or concerns regarding these Terms and Conditions or administrative platform governance, please contact our lead administration:
                </p>
                <div class="p-4 rounded-2xl bg-surface-container border border-white/5 space-y-1.5 text-xs sm:text-sm">
                    <div><strong class="text-on-surface">Platform:</strong> CodeCollab Open-Source Collaboration</div>
                    <div><strong class="text-on-surface">Lead Administrator:</strong> Dev</div>
                    <div><strong class="text-on-surface">Email:</strong> <a href="mailto:scriptedbydev@gmail.com" class="text-primary hover:underline font-mono">scriptedbydev@gmail.com</a></div>
                    <div><strong class="text-on-surface">In-App Contact:</strong> <a href="#contact" class="text-primary hover:underline">CodeCollab Contact Form</a></div>
                </div>
            </div>
        </section>

        <!-- Bottom Action Bar -->
        <div class="pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <button onclick="window.history.back()" class="w-full sm:w-auto px-6 py-3 bg-surface-container hover:bg-surface-variant text-on-surface rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2">
                <span class="material-symbols-outlined text-[16px]">arrow_back</span> Go Back
            </button>
            <div class="flex items-center gap-3 w-full sm:w-auto">
                <a href="#privacy" class="w-full sm:w-auto text-center px-5 py-3 bg-surface-container hover:bg-surface-variant text-on-surface-variant hover:text-on-surface rounded-xl text-xs font-bold transition-all">
                    Privacy Policy
                </a>
                <a href="#home" class="w-full sm:w-auto text-center px-6 py-3 bg-primary text-on-primary rounded-xl text-xs font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-all">
                    Return to Platform
                </a>
            </div>
        </div>
    </div>
</main>
`;
}
