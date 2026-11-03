import { ContentPageTemplate, type ContentSection } from "@/components/templates";

const SECTIONS: ContentSection[] = [
  {
    id: "accounts",
    title: "Accounts",
    body: (
      <>
        <p>
          When you create an account with us, you must provide information that is accurate,
          complete and current at all times. Failure to do so constitutes a breach of the Terms,
          which may result in immediate termination of your account.
        </p>
        <p>
          You are responsible for safeguarding the password you use to access the Service and for
          any activities or actions under your password. You agree not to disclose your password to
          any third party, and to notify us immediately of any breach of security or unauthorised
          use of your account.
        </p>
      </>
    ),
  },
  {
    id: "ip",
    title: "Intellectual property",
    body: (
      <p>
        The Service and its original content, features and functionality are and will remain the
        exclusive property of BusWatch and its licensors. Our trademarks and trade dress may not be
        used in connection with any product or service without the prior written consent of
        BusWatch.
      </p>
    ),
  },
  {
    id: "links",
    title: "Links to other websites",
    body: (
      <p>
        Our Service may contain links to third-party websites or services that are not owned or
        controlled by BusWatch. BusWatch has no control over, and assumes no responsibility for,
        their content, privacy policies or practices, and shall not be liable for any damage or loss
        caused by your use of them. We strongly advise you to read their terms and privacy policies.
      </p>
    ),
  },
  {
    id: "termination",
    title: "Termination",
    body: (
      <p>
        We may terminate or suspend your account immediately, without prior notice or liability, for
        any reason, including if you breach the Terms. Upon termination, your right to use the
        Service will immediately cease. Provisions which by their nature should survive termination
        shall survive, including ownership provisions, warranty disclaimers, indemnity and
        limitations of liability.
      </p>
    ),
  },
  {
    id: "indemnification",
    title: "Indemnification",
    body: (
      <p>
        You agree to defend, indemnify and hold harmless BusWatch and its licensees, licensors,
        employees, contractors, agents, officers and directors from any claims, damages,
        obligations, losses, liabilities, costs or expenses (including attorney&apos;s fees)
        resulting from your use of the Service or a breach of these Terms.
      </p>
    ),
  },
  {
    id: "liability",
    title: "Limitation of liability",
    body: (
      <p>
        In no event shall BusWatch, nor its directors, employees, partners, agents, suppliers or
        affiliates, be liable for any indirect, incidental, special, consequential or punitive
        damages, including loss of profits, data, use, goodwill or other intangible losses,
        resulting from your access to or use of (or inability to use) the Service, any conduct or
        content of any third party on the Service, any content obtained from the Service, or
        unauthorised access to or alteration of your transmissions or content.
      </p>
    ),
  },
  {
    id: "disclaimer",
    title: "Disclaimer",
    body: (
      <p>
        Your use of the Service is at your sole risk. The Service is provided on an &quot;as
        is&quot; and &quot;as available&quot; basis, without warranties of any kind. BusWatch does
        not warrant that the Service will function uninterrupted or securely, that errors will be
        corrected, that it is free of harmful components, or that the results of using it will meet
        your requirements.
      </p>
    ),
  },
  {
    id: "law",
    title: "Governing law",
    body: (
      <p>
        These Terms are governed by the laws of Sri Lanka, without regard to conflict of law
        provisions. If any provision is held invalid, the remaining provisions remain in effect.
        These Terms constitute the entire agreement between us regarding our Service.
      </p>
    ),
  },
  {
    id: "changes",
    title: "Changes",
    body: (
      <p>
        We may modify or replace these Terms at any time. If a revision is material we will try to
        provide at least 30 days&apos; notice before the new terms take effect. By continuing to use
        the Service after revisions become effective, you agree to the revised terms.
      </p>
    ),
  },
  {
    id: "contact",
    title: "Contact us",
    body: (
      <p>
        If you have any questions about these Terms, email us at{" "}
        <a href="mailto:terms@buswatch.com">terms@buswatch.com</a>.
      </p>
    ),
  },
];

function TermsOfServiceView() {
  return (
    <ContentPageTemplate
      title="Terms of service"
      updated="May 29, 2025"
      intro={
        <p>
          Please read these Terms of Service (&quot;Terms&quot;) carefully before using the BusWatch
          website (the &quot;Service&quot;). Your access to and use of the Service is conditioned on
          your acceptance of these Terms, which apply to all visitors, users and others who access
          the Service. If you disagree with any part of them, you may not access the Service.
        </p>
      }
      sections={SECTIONS}
    />
  );
}

export default TermsOfServiceView;
