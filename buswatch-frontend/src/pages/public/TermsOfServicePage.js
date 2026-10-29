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

function TermsOfServicePage() {
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
          Terms of Service for BusWatch
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
          Please read these Terms of Service ("Terms", "Terms of Service")
          carefully before using the BusWatch mobile application and website
          (the "Service") operated by BusWatch ("us", "we", or "our").
        </Typography>
        <Typography variant="body1" paragraph>
          Your access to and use of the Service is conditioned on your
          acceptance of and compliance with these Terms. These Terms apply to
          all visitors, users and others who access or use the Service.
        </Typography>
        <Typography variant="body1" paragraph>
          By accessing or using the Service you agree to be bound by these
          Terms. If you disagree with any part of the terms then you may not
          access the Service.
        </Typography>

        <SectionTitle variant="h5">Accounts</SectionTitle>
        <Typography variant="body1" paragraph>
          When you create an account with us, you must provide us information
          that is accurate, complete, and current at all times. Failure to do so
          constitutes a breach of the Terms, which may result in immediate
          termination of your account on our Service.
        </Typography>
        <Typography variant="body1" paragraph>
          You are responsible for safeguarding the password that you use to
          access the Service and for any activities or actions under your
          password, whether your password is with our Service or a third-party
          service.
        </Typography>
        <Typography variant="body1" paragraph>
          You agree not to disclose your password to any third party. You must
          notify us immediately upon becoming aware of any breach of security or
          unauthorized use of your account.
        </Typography>

        <SectionTitle variant="h5">Intellectual Property</SectionTitle>
        <Typography variant="body1" paragraph>
          The Service and its original content, features and functionality are
          and will remain the exclusive property of BusWatch and its licensors.
          The Service is protected by copyright, trademark, and other laws of
          both the Sri Lanka and foreign countries. Our trademarks and trade
          dress may not be used in connection with any product or service
          without the prior written consent of BusWatch.
        </Typography>

        <SectionTitle variant="h5">Links To Other Web Sites</SectionTitle>
        <Typography variant="body1" paragraph>
          Our Service may contain links to third-party web sites or services
          that are not owned or controlled by BusWatch.
        </Typography>
        <Typography variant="body1" paragraph>
          BusWatch has no control over, and assumes no responsibility for, the
          content, privacy policies, or practices of any third party web sites
          or services. You further acknowledge and agree that BusWatch shall not
          be responsible or liable, directly or indirectly, for any damage or
          loss caused or alleged to be caused by or in connection with use of or
          reliance on any such content, goods or services available on or
          through any such web sites or services.
        </Typography>
        <Typography variant="body1" paragraph>
          We strongly advise you to read the terms and conditions and privacy
          policies of any third-party web sites or services that you visit.
        </Typography>

        <SectionTitle variant="h5">Termination</SectionTitle>
        <Typography variant="body1" paragraph>
          We may terminate or suspend your account immediately, without prior
          notice or liability, for any reason whatsoever, including without
          limitation if you breach the Terms.
        </Typography>
        <Typography variant="body1" paragraph>
          Upon termination, your right to use the Service will immediately
          cease. If you wish to terminate your account, you may simply
          discontinue using the Service.
        </Typography>
        <Typography variant="body1" paragraph>
          All provisions of the Terms which by their nature should survive
          termination shall survive termination, including, without limitation,
          ownership provisions, warranty disclaimers, indemnity and limitations
          of liability.
        </Typography>

        <SectionTitle variant="h5">Indemnification</SectionTitle>
        <Typography variant="body1" paragraph>
          You agree to defend, indemnify and hold harmless BusWatch and its
          licensee and licensors, and their employees, contractors, agents,
          officers and directors, from and against any and all claims, damages,
          obligations, losses, liabilities, costs or debt, and expenses
          (including but not limited to attorney's fees), resulting from or
          arising out of a) your use and access of the Service, by you or any
          person using your account and password; or b) a breach of these Terms.
        </Typography>

        <SectionTitle variant="h5">Limitation Of Liability</SectionTitle>
        <Typography variant="body1" paragraph>
          In no event shall BusWatch, nor its directors, employees, partners,
          agents, suppliers, or affiliates, be liable for any indirect,
          incidental, special, consequential or punitive damages, including
          without limitation, loss of profits, data, use, goodwill, or other
          intangible losses, resulting from (i) your access to or use of or
          inability to access or use the Service; (ii) any conduct or content of
          any third party on the Service; (iii) any content obtained from the
          Service; and (iv) unauthorized access, use or alteration of your
          transmissions or content, whether based on warranty, contract, tort
          (including negligence) or any other legal theory, whether or not we
          have been informed of the possibility of such damage, and even if a
          remedy set forth herein is found to have failed of its essential
          purpose.
        </Typography>

        <SectionTitle variant="h5">Disclaimer</SectionTitle>
        <Typography variant="body1" paragraph>
          Your use of the Service is at your sole risk. The Service is provided
          on an "AS IS" and "AS AVAILABLE" basis. The Service is provided
          without warranties of any kind, whether express or implied, including,
          but not limited to, implied warranties of merchantability, fitness for
          a particular purpose, non-infringement or course of performance.
        </Typography>
        <Typography variant="body1" paragraph>
          BusWatch its subsidiaries, affiliates, and its licensors do not
          warrant that a) the Service will function uninterrupted, secure or
          available at any particular time or location; b) any errors or defects
          will be corrected; c) the Service is free of viruses or other harmful
          components; or d) the results of using the Service will meet your
          requirements.
        </Typography>

        <SectionTitle variant="h5">Governing Law</SectionTitle>
        <Typography variant="body1" paragraph>
          These Terms shall be governed and construed in accordance with the
          laws of Sri Lanka, without regard to its conflict of law provisions.
        </Typography>
        <Typography variant="body1" paragraph>
          Our failure to enforce any right or provision of these Terms will not
          be considered a waiver of those rights. If any provision of these
          Terms is held to be invalid or unenforceable by a court, the remaining
          provisions of these Terms will remain in effect. These Terms
          constitute the entire agreement between us regarding our Service, and
          supersede and replace any prior agreements we might have between us
          regarding the Service.
        </Typography>

        <SectionTitle variant="h5">Changes</SectionTitle>
        <Typography variant="body1" paragraph>
          We reserve the right, at our sole discretion, to modify or replace
          these Terms at any time. If a revision is material we will try to
          provide at least 30 days notice prior to any new terms taking effect.
          What constitutes a material change will be determined at our sole
          discretion.
        </Typography>
        <Typography variant="body1" paragraph>
          By continuing to access or use our Service after those revisions
          become effective, you agree to be bound by the revised terms. If you
          do not agree to the new terms, please stop using the Service.
        </Typography>

        <SectionTitle variant="h5">Contact Us</SectionTitle>
        <Typography variant="body1" paragraph>
          If you have any questions about these Terms, please contact us:
        </Typography>
        <Box component="ul" sx={{ pl: 4, mb: 2 }}>
          <Typography component="li" variant="body1">
            By email: terms@buswatch.com
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

export default TermsOfServicePage;
