import type { Metadata } from "next";
import Link from "next/link";
import Shell from "@/components/Shell";
import PageBackButton from "@/components/PageBackButton";

export const metadata: Metadata = {
  title: "Privacy Policy — Slowbit",
  description:
    "How Slowbit handles browser preferences, optional analytics, and public board messages.",
  alternates: { canonical: "/privacy/" },
};

export default function PrivacyPolicy() {
  return (
    <Shell>
      <main className="content-page privacy-page">
        <PageBackButton />
        <header className="privacy-heading">
          <span className="eyebrow">SLOWBIT · PRIVACY</span>
          <h1>Privacy Policy</h1>
          <p>Last updated: October 22, 2026</p>
        </header>

        <section className="privacy-intro">
          <h2>1. Introduction</h2>
          <p>
            Slowbit is a free, open-source web application for focus, rest, and
            calming visual and audio experiences. It is currently offered as a
            public beta to a worldwide audience.
          </p>
          <p>
            We aim to collect as little personal information as possible. This
            policy describes the information Slowbit processes, why it is used,
            how long it may remain, and the choices available to you.
          </p>
        </section>

        <section>
          <h2>2. Who operates Slowbit?</h2>
          <p>Slowbit is operated by Souhail EL MAHDANI, an individual based in Morocco.</p>
          <p>
            Privacy questions and requests can be sent to{" "}
            <a href="mailto:elmahdanisouhail@gmail.com">elmahdanisouhail@gmail.com</a>.
          </p>
        </section>

        <section>
          <h2>3. Information Slowbit processes</h2>
          <p>
            Slowbit can process browser preferences, optional product analytics,
            public board messages, and ordinary technical request data needed to
            deliver and secure the service. Slowbit does not require an account.
          </p>
          <p>
            Pseudonymous identifiers and technical request metadata can still be
            personal information under applicable law, even when they do not
            contain a visitor&apos;s name.
          </p>
          <p>
            Slowbit does not contain advertising, sell personal information, or
            embed YouTube, Spotify, SoundCloud, external radio players, feedback
            widgets, third-party iframes, or hosted web fonts.
          </p>
          <p>
            Where a legal basis is required, Slowbit relies on explicit consent
            for optional analytics. Local preferences and technical request
            handling are used to provide the functionality you request, operate
            the service, and protect it. The appropriate basis can vary by
            jurisdiction and by the specific processing involved.
          </p>
        </section>

        <section>
          <h2>4. Browser storage and local preferences</h2>
          <p>
            Slowbit uses browser storage to remember favorite and hidden scenes,
            sound and volume settings, onboarding state, optional analytics
            consent, and other application preferences. Temporary session state
            may also be kept in session storage until the tab is closed.
          </p>
          <p>
            These settings are not uploaded to a Slowbit account. You can remove
            them through your browser&apos;s site-data controls, though doing so will
            reset your saved Slowbit preferences.
          </p>
        </section>

        <section>
          <h2>5. Optional PostHog analytics</h2>
          <p>
            Slowbit uses PostHog Cloud EU only after you select Allow. Analytics
            help us understand use of modes, scenes, sessions, playlists, and
            controls. Events may include a pseudonymous browser identifier and
            basic browser, device, page, referral, screen, and viewport context
            automatically attached by the analytics software.
          </p>
          <p>
            Analytics are disabled by default. Declining does not reduce any
            Slowbit feature and your choice remains in your browser until you
            change it or clear site data. You can change or withdraw your choice
            at any time in <Link href="/settings/">Settings</Link>.
          </p>
          <p>
            Slowbit disables PostHog autocapture, session recording, heatmaps,
            surveys, exception capture, performance capture, dead-click capture,
            and rage-click capture. Slowbit does not call PostHog&apos;s identified
            profile function and does not send board-message text to PostHog.
            Where consent is the applicable legal basis, analytics are processed
            only after that consent.
          </p>
        </section>

        <section>
          <h2>6. Anonymous public message board</h2>
          <p>
            The message board is public. A message can be read by anyone who
            opens it and may remain visible indefinitely. Do not include personal,
            confidential, or sensitive information.
          </p>
          <p>
            The D1 database stores the message text, a random message ID, its
            creation time, and a submission key derived from a posting token.
            Posting-token hashes expire after 24 hours; expired token rows are
            removed opportunistically when new tokens are issued rather than by
            a guaranteed scheduled job.
          </p>
          <p>
            Slowbit does not intentionally write IP addresses, names, accounts,
            cookies, or browser fingerprints to the board database. Cloudflare
            still receives ordinary network information such as IP addresses and
            request headers to deliver and protect the board service.
          </p>
          <p>
            Board messages have no automatic expiry and are retained indefinitely
            unless manually removed. To request removal, contact the operator with
            the message text and approximate posting time. Because there are no
            user accounts, Slowbit may be unable to prove who submitted a message;
            each request must be assessed using the information available.
          </p>
        </section>

        <section>
          <h2>7. Hosting and third-party service providers</h2>
          <ul>
            <li><strong>Vercel Hobby</strong> hosts the website and processes requests to deliver it.</li>
            <li><strong>Cloudflare</strong> delivers audio and visual assets from R2 and provides the board&apos;s Worker and D1 database.</li>
            <li><strong>PostHog Cloud EU</strong> processes optional analytics only after consent.</li>
          </ul>
          <p>
            These providers can process technical request information under their
            own infrastructure and security practices. GitHub is linked as an
            ordinary external website; it is not embedded in Slowbit.
          </p>
        </section>

        <section>
          <h2>8. Data retention</h2>
          <ul>
            <li>Browser preferences remain until you clear site data or Slowbit changes or removes the stored setting.</li>
            <li>PostHog&apos;s current free-plan event retention is a one-year query window. This is not a guarantee that every underlying record is permanently erased at exactly one year.</li>
            <li>Vercel Hobby runtime logs are currently retained for one hour. Build, deployment, security, and other operational records can follow different retention rules.</li>
            <li>Cloudflare Workers Logs are enabled and currently retained for three days. They can include technical request information, errors, and execution metadata.</li>
            <li>Cloudflare R2 Data Access Logs are disabled.</li>
            <li>Public D1 board messages are retained indefinitely unless manually removed. Posting-token hashes expire after 24 hours and are cleaned up opportunistically.</li>
          </ul>
          <p>
            Providers may keep separate security, billing, abuse-prevention, or
            legal records according to their own terms and obligations.
          </p>
        </section>

        <section>
          <h2>9. International data processing and transfers</h2>
          <p>
            Slowbit is operated from Morocco and is available worldwide. Vercel,
            Cloudflare, and PostHog operate infrastructure in multiple countries,
            so information may be processed outside your country. Their contractual
            and technical safeguards apply to those transfers where required.
          </p>
        </section>

        <section>
          <h2>10. Privacy choices and rights</h2>
          <p>
            You can use Slowbit without analytics, change analytics consent in
            Settings, clear locally stored preferences, and request access,
            correction, restriction, objection, portability, or deletion where
            the law applicable to your request provides those rights.
          </p>
          <p>
            You may also have the right to complain to a relevant data-protection
            authority. Slowbit will assess requests according to the law that
            applies and the information it can reasonably connect to the request.
          </p>
        </section>

        <section>
          <h2>11. Historical data-deletion requests</h2>
          <p>
            Withdrawing analytics consent stops future optional collection and
            clears local PostHog identifiers where supported. It does not itself
            delete analytics events previously received by PostHog.
          </p>
          <p>
            If an existing analytics browser ID is available, Settings lets you
            copy it before withdrawing. You can email that ID with a deletion
            request. A browser ID is pseudonymous and is not conclusive proof of
            identity or ownership, so Slowbit may need to validate the request
            before asking PostHog to delete matching events.
          </p>
        </section>

        <section>
          <h2>12. Security</h2>
          <p>
            Slowbit uses established infrastructure providers and applies
            reasonable technical and organizational measures for this public beta.
            No website or internet transmission can be guaranteed completely secure.
          </p>
        </section>

        <section>
          <h2>13. Children&apos;s privacy</h2>
          <p>
            Slowbit is a general-audience service and is not directed to children.
            It does not knowingly request names, accounts, or other direct contact
            information from children. If you believe a child has submitted
            personal information on the public board, contact the operator.
          </p>
        </section>

        <section>
          <h2>14. Changes to this policy</h2>
          <p>
            This policy may change as Slowbit evolves. The date at the top will be
            updated when the policy changes materially. Where appropriate, Slowbit
            may also present an in-product notice.
          </p>
        </section>

        <section>
          <h2>15. Contact</h2>
          <p>
            Questions and privacy or deletion requests can be sent to{" "}
            <a href="mailto:elmahdanisouhail@gmail.com">elmahdanisouhail@gmail.com</a>.
          </p>
          <p>Website: <a href="https://slowbit.vercel.app">slowbit.vercel.app</a></p>
        </section>
      </main>
    </Shell>
  );
}
