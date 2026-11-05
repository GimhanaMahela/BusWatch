import { useTranslations } from "next-intl";
import { ContentPageTemplate, type ContentSection } from "@/components/templates";

const SECTIONS: ContentSection[] = [
  {
    id: "collection",
    title: "Information collection and use",
    body: (
      <>
        <p>
          We collect several different types of information for various purposes to provide and
          improve our Service to you.
        </p>
        <h3>Personal data</h3>
        <p>
          While using our Service, we may ask you to provide us with certain personally identifiable
          information that can be used to contact or identify you (&quot;Personal Data&quot;). This
          may include, but is not limited to:
        </p>
        <ul>
          <li>Email address (optional, for report receipts)</li>
          <li>Location data (for incident reports)</li>
          <li>The language you used the site in, so emails and receipts reach you in it</li>
          <li>
            Your rating of how a report was handled and any comment you add (optional, linked to
            that report only)
          </li>
          <li>Usage Data</li>
        </ul>
        <h3>Anonymous usage counts</h3>
        <p>
          To learn whether BusWatch works for passengers, we count a few events per day, for example
          how many report forms were started, how many tracking pages were opened, and how many
          people arrived by scanning the QR sticker in a bus. These are daily totals only: they
          contain no identifiers, no IP address and nothing about who you are.
        </p>
        <h3>Usage data</h3>
        <p>
          We may also collect information about how the Service is accessed and used (&quot;Usage
          Data&quot;). This may include your device&apos;s Internet Protocol address, browser type
          and version, the pages you visit, the time and date of your visit, the time spent on those
          pages, unique device identifiers and other diagnostic data.
        </p>
        <h3>Tracking and cookies</h3>
        <p>
          We use cookies and similar technologies to track activity on our Service and hold certain
          information. Cookies are small files that may include an anonymous unique identifier. We
          also use beacons, tags and scripts to collect information and to improve and analyse our
          Service.
        </p>
        <p>
          We set one cookie of our own, <strong>NEXT_LOCALE</strong>, which remembers the language
          you chose (English, Sinhala or Tamil) for a year.
        </p>
        <p>
          You can instruct your browser to refuse all cookies or to indicate when a cookie is being
          sent. If you do not accept cookies, you may not be able to use some portions of our
          Service.
        </p>
        <h3>Public statistics</h3>
        <p>
          Our impact page and the bus and route scorecards show totals only: how many reports were
          received and resolved, by category, by month and by area. Only reports our team has
          checked are counted, and a bus or route is shown only once it has several of them. Map
          areas cover about 5 km and need several reports before they appear. Your name, email,
          receipt ID, description, photos and the exact time or place of your report are never
          published. Stories about resolved cases are written by our team without passenger details.
        </p>
        <h3>Security check</h3>
        <p>
          To keep automated spam out of public figures, report submissions may pass through
          Cloudflare Turnstile, which checks that a person is sending them. Cloudflare processes
          technical data about your browser for this purpose only.
        </p>
        <h3>Data kept on your device</h3>
        <p>
          If you install BusWatch or lose your connection while writing a report, the unfinished
          report (including any photos and videos you attached) is stored in your browser on your
          own device until it is sent or you start over. We cannot see it until you send it. You can
          remove it at any time by choosing &quot;Start over&quot; on the form or by clearing the
          site data in your browser.
        </p>
      </>
    ),
  },
  {
    id: "use",
    title: "Use of data",
    body: (
      <>
        <p>BusWatch uses the collected data:</p>
        <ul>
          <li>To provide and maintain the Service</li>
          <li>To notify you about changes to our Service</li>
          <li>To allow you to participate in interactive features when you choose to do so</li>
          <li>To provide customer care and support</li>
          <li>To provide analysis or valuable information so that we can improve the Service</li>
          <li>To monitor the usage of the Service</li>
          <li>To detect, prevent and address technical issues</li>
          <li>To provide you with a receipt for your submitted report (if email is provided)</li>
        </ul>
      </>
    ),
  },
  {
    id: "transfer",
    title: "Transfer of data",
    body: (
      <>
        <p>
          Your information, including Personal Data, may be transferred to and maintained on
          computers located outside of your state, province, country or other governmental
          jurisdiction where data protection laws may differ from those of your jurisdiction.
        </p>
        <p>
          If you are located outside Sri Lanka and choose to provide information to us, please note
          that we transfer the data, including Personal Data, to Sri Lanka and process it there.
          Your consent to this Privacy Policy followed by your submission of such information
          represents your agreement to that transfer.
        </p>
        <p>
          BusWatch will take all steps reasonably necessary to ensure that your data is treated
          securely and in accordance with this Privacy Policy, and no transfer of your Personal Data
          will take place to an organisation or a country unless there are adequate controls in
          place.
        </p>
      </>
    ),
  },
  {
    id: "disclosure",
    title: "Disclosure of data",
    body: (
      <>
        <p>
          BusWatch may disclose your Personal Data in the good faith belief that such action is
          necessary:
        </p>
        <ul>
          <li>To comply with a legal obligation</li>
          <li>To protect and defend the rights or property of BusWatch</li>
          <li>To prevent or investigate possible wrongdoing in connection with the Service</li>
          <li>To protect the personal safety of users of the Service or the public</li>
          <li>To protect against legal liability</li>
        </ul>
      </>
    ),
  },
  {
    id: "security",
    title: "Security of data",
    body: (
      <p>
        The security of your data is important to us, but no method of transmission over the
        Internet or method of electronic storage is 100% secure. While we strive to use commercially
        acceptable means to protect your Personal Data, we cannot guarantee its absolute security.
      </p>
    ),
  },
  {
    id: "providers",
    title: "Service providers",
    body: (
      <p>
        We may employ third-party companies and individuals to facilitate our Service, to provide it
        on our behalf, to perform Service-related services or to help us analyse how it is used.
        They have access to your Personal Data only to perform these tasks on our behalf and are
        obligated not to disclose or use it for any other purpose.
      </p>
    ),
  },
  {
    id: "links",
    title: "Links to other sites",
    body: (
      <p>
        Our Service may contain links to sites not operated by us. We strongly advise you to review
        the privacy policy of every site you visit. We have no control over and assume no
        responsibility for the content, privacy policies or practices of any third-party sites or
        services.
      </p>
    ),
  },
  {
    id: "children",
    title: "Children's privacy",
    body: (
      <p>
        Our Service does not address anyone under the age of 18. We do not knowingly collect
        personally identifiable information from children. If you are a parent or guardian and you
        are aware that your child has provided us with Personal Data, please contact us and we will
        remove that information from our servers.
      </p>
    ),
  },
  {
    id: "changes",
    title: "Changes to this policy",
    body: (
      <p>
        We may update our Privacy Policy from time to time. We will notify you by email and/or a
        prominent notice on our Service before the change becomes effective, and update the
        &quot;last updated&quot; date above. Changes are effective when they are posted on this
        page.
      </p>
    ),
  },
  {
    id: "contact",
    title: "Contact us",
    body: (
      <p>
        If you have any questions about this Privacy Policy, email us at{" "}
        <a href="mailto:privacy@buswatch.com">privacy@buswatch.com</a>.
      </p>
    ),
  },
];

function PrivacyPolicyView() {
  const t = useTranslations("meta");
  return (
    <ContentPageTemplate
      title={t("privacyTitle")}
      updated="November 5, 2026"
      intro={
        <p>
          BusWatch (&quot;us&quot;, &quot;we&quot;, or &quot;our&quot;) operates the BusWatch
          website (the &quot;Service&quot;). This page explains how we collect, use and disclose
          personal data when you use the Service, and the choices you have. By using the Service,
          you agree to the collection and use of information in accordance with this policy.
        </p>
      }
      sections={SECTIONS}
    />
  );
}

export default PrivacyPolicyView;
