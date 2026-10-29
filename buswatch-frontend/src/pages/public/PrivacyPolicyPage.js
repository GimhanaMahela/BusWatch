import React from "react";
import { Box, Typography, Container, Paper } from "@mui/material";
import { styled } from "@mui/system";

const PageContainer = styled(Container)(({ theme }) => ({
  marginTop: theme.spacing(4),
  marginBottom: theme.spacing(4),
  padding: theme.spacing(3),
  [theme.breakpoints.up("md")]: {
    padding: theme.spacing(5),
  },
}));

const ContentPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  borderRadius: theme.shape.borderRadius * 2,
  boxShadow: theme.shadows[8],
  background: `linear-gradient(145deg, ${theme.palette.background.paper}, ${theme.palette.grey[50]})`,
}));

const SectionTitle = styled(Typography)(({ theme }) => ({
  marginTop: theme.spacing(4),
  marginBottom: theme.spacing(2),
  fontWeight: 600,
  color: theme.palette.primary.main,
}));

const SubSectionTitle = styled(Typography)(({ theme }) => ({
  marginTop: theme.spacing(3),
  marginBottom: theme.spacing(1),
  fontWeight: 500,
  color: theme.palette.text.primary,
}));

function PrivacyPolicyPage() {
  return (
    <PageContainer maxWidth="md">
      <ContentPaper elevation={3}>
        <Typography
          variant="h4"
          component="h1"
          gutterBottom
          align="center"
          sx={{ fontWeight: 700, color: "primary.dark" }}
        >
          Privacy Policy for BusWatch
        </Typography>
        <Typography
          variant="body2"
          align="center"
          color="textSecondary"
          sx={{ mb: 4 }}
        >
          **Last updated: May 29, 2025**
        </Typography>

        <Typography variant="body1" paragraph>
          BusWatch ("us", "we", or "our") operates the BusWatch mobile
          application and website (the "Service").
        </Typography>
        <Typography variant="body1" paragraph>
          This page informs you of our policies regarding the collection, use,
          and disclosure of personal data when you use our Service and the
          choices you have associated with that data.
        </Typography>
        <Typography variant="body1" paragraph>
          We use your data to provide and improve the Service. By using the
          Service, you agree to the collection and use of information in
          accordance with this policy. Unless otherwise defined in this Privacy
          Policy, terms used in this Privacy Policy have the same meanings as in
          our Terms and Conditions.
        </Typography>

        <SectionTitle variant="h5">Information Collection and Use</SectionTitle>
        <Typography variant="body1" paragraph>
          We collect several different types of information for various purposes
          to provide and improve our Service to you.
        </Typography>

        <SubSectionTitle variant="h6">Types of Data Collected</SubSectionTitle>
        <Typography variant="body1" paragraph>
          **Personal Data** While using our Service, we may ask you to provide
          us with certain personally identifiable information that can be used
          to contact or identify you ("Personal Data"). Personally identifiable
          information may include, but is not limited to:
        </Typography>
        <Box component="ul" sx={{ pl: 4, mb: 2 }}>
          <Typography component="li" variant="body1">
            Email address (optional, for report receipts)
          </Typography>
          <Typography component="li" variant="body1">
            Location data (for incident reports)
          </Typography>
          <Typography component="li" variant="body1">
            Usage Data
          </Typography>
        </Box>

        <Typography variant="body1" paragraph>
          **Usage Data** We may also collect information about how the Service
          is accessed and used ("Usage Data"). This Usage Data may include
          information such as your computer's Internet Protocol address (e.g. IP
          address), browser type, browser version, the pages of our Service that
          you visit, the time and date of your visit, the time spent on those
          pages, unique device identifiers and other diagnostic data.
        </Typography>

        <Typography variant="body1" paragraph>
          **Tracking & Cookies Data** We use cookies and similar tracking
          technologies to track the activity on our Service and hold certain
          information.
        </Typography>
        <Typography variant="body1" paragraph>
          Cookies are files with a small amount of data which may include an
          anonymous unique identifier. Cookies are sent to your browser from a
          website and stored on your device. Tracking technologies also used are
          beacons, tags, and scripts to collect and track information and to
          improve and analyze our Service.
        </Typography>
        <Typography variant="body1" paragraph>
          You can instruct your browser to refuse all cookies or to indicate
          when a cookie is being sent. However, if you do not accept cookies,
          you may not be able to use some portions of our Service.
        </Typography>

        <SectionTitle variant="h5">Use of Data</SectionTitle>
        <Typography variant="body1" paragraph>
          BusWatch uses the collected data for various purposes:
        </Typography>
        <Box component="ul" sx={{ pl: 4, mb: 2 }}>
          <Typography component="li" variant="body1">
            To provide and maintain the Service
          </Typography>
          <Typography component="li" variant="body1">
            To notify you about changes to our Service
          </Typography>
          <Typography component="li" variant="body1">
            To allow you to participate in interactive features of our Service
            when you choose to do so
          </Typography>
          <Typography component="li" variant="body1">
            To provide customer care and support
          </Typography>
          <Typography component="li" variant="body1">
            To provide analysis or valuable information so that we can improve
            the Service
          </Typography>
          <Typography component="li" variant="body1">
            To monitor the usage of the Service
          </Typography>
          <Typography component="li" variant="body1">
            To detect, prevent and address technical issues
          </Typography>
          <Typography component="li" variant="body1">
            To provide you with a receipt for your submitted report (if email is
            provided)
          </Typography>
        </Box>

        <SectionTitle variant="h5">Transfer Of Data</SectionTitle>
        <Typography variant="body1" paragraph>
          Your information, including Personal Data, may be transferred to — and
          maintained on — computers located outside of your state, province,
          country or other governmental jurisdiction where the data protection
          laws may differ than those from your jurisdiction.
        </Typography>
        <Typography variant="body1" paragraph>
          If you are located outside Sri Lanka and choose to provide information
          to us, please note that we transfer the data, including Personal Data,
          to Sri Lanka and process it there.
        </Typography>
        <Typography variant="body1" paragraph>
          Your consent to this Privacy Policy followed by your submission of
          such information represents your agreement to that transfer.
        </Typography>
        <Typography variant="body1" paragraph>
          BusWatch will take all steps reasonably necessary to ensure that your
          data is treated securely and in accordance with this Privacy Policy
          and no transfer of your Personal Data will take place to an
          organization or a country unless there are adequate controls in place
          including the security of your data and other personal information.
        </Typography>

        <SectionTitle variant="h5">Disclosure Of Data</SectionTitle>
        <SubSectionTitle variant="h6">Legal Requirements</SubSectionTitle>
        <Typography variant="body1" paragraph>
          BusWatch may disclose your Personal Data in the good faith belief that
          such action is necessary to:
        </Typography>
        <Box component="ul" sx={{ pl: 4, mb: 2 }}>
          <Typography component="li" variant="body1">
            To comply with a legal obligation
          </Typography>
          <Typography component="li" variant="body1">
            To protect and defend the rights or property of BusWatch
          </Typography>
          <Typography component="li" variant="body1">
            To prevent or investigate possible wrongdoing in connection with the
            Service
          </Typography>
          <Typography component="li" variant="body1">
            To protect the personal safety of users of the Service or the public
          </Typography>
          <Typography component="li" variant="body1">
            To protect against legal liability
          </Typography>
        </Box>

        <SectionTitle variant="h5">Security Of Data</SectionTitle>
        <Typography variant="body1" paragraph>
          The security of your data is important to us, but remember that no
          method of transmission over the Internet, or method of electronic
          storage is 100% secure. While we strive to use commercially acceptable
          means to protect your Personal Data, we cannot guarantee its absolute
          security.
        </Typography>

        <SectionTitle variant="h5">Service Providers</SectionTitle>
        <Typography variant="body1" paragraph>
          We may employ third party companies and individuals to facilitate our
          Service ("Service Providers"), to provide the Service on our behalf,
          to perform Service-related services or to assist us in analyzing how
          our Service is used.
        </Typography>
        <Typography variant="body1" paragraph>
          These third parties have access to your Personal Data only to perform
          these tasks on our behalf and are obligated not to disclose or use it
          for any other purpose.
        </Typography>

        <SectionTitle variant="h5">Links To Other Sites</SectionTitle>
        <Typography variant="body1" paragraph>
          Our Service may contain links to other sites that are not operated by
          us. If you click on a third party link, you will be directed to that
          third party's site. We strongly advise you to review the Privacy
          Policy of every site you visit.
        </Typography>
        <Typography variant="body1" paragraph>
          We have no control over and assume no responsibility for the content,
          privacy policies or practices of any third party sites or services.
        </Typography>

        <SectionTitle variant="h5">Children's Privacy</SectionTitle>
        <Typography variant="body1" paragraph>
          Our Service does not address anyone under the age of 18 ("Children").
        </Typography>
        <Typography variant="body1" paragraph>
          We do not knowingly collect personally identifiable information from
          anyone under the age of 18. If you are a parent or guardian and you
          are aware that your Children has provided us with Personal Data,
          please contact us. If we become aware that we have collected Personal
          Data from children without verification of parental consent, we take
          steps to remove that information from our servers.
        </Typography>

        <SectionTitle variant="h5">Changes To This Privacy Policy</SectionTitle>
        <Typography variant="body1" paragraph>
          We may update our Privacy Policy from time to time. We will notify you
          of any changes by posting the new Privacy Policy on this page.
        </Typography>
        <Typography variant="body1" paragraph>
          We will let you know via email and/or a prominent notice on our
          Service, prior to the change becoming effective and update the "last
          updated" date at the top of this Privacy Policy.
        </Typography>
        <Typography variant="body1" paragraph>
          You are advised to review this Privacy Policy periodically for any
          changes. Changes to this Privacy Policy are effective when they are
          posted on this page.
        </Typography>

        <SectionTitle variant="h5">Contact Us</SectionTitle>
        <Typography variant="body1" paragraph>
          If you have any questions about this Privacy Policy, please contact
          us:
        </Typography>
        <Box component="ul" sx={{ pl: 4, mb: 2 }}>
          <Typography component="li" variant="body1">
            By email: privacy@buswatch.com
          </Typography>
          <Typography component="li" variant="body1">
            By visiting this page on our website:{" "}
            <a
              href="http://www.buswatch.com/contact"
              target="_blank"
              rel="noopener noreferrer"
            >
              www.buswatch.com/contact
            </a>
          </Typography>
        </Box>
      </ContentPaper>
    </PageContainer>
  );
}

export default PrivacyPolicyPage;
