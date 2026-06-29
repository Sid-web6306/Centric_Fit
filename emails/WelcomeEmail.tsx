import {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'

export interface WelcomeEmailProps {
  userName: string
  gymName: string
  dashboardUrl: string
  role: string
}

export default function WelcomeEmail({
  userName,
  gymName,
  dashboardUrl,
  role,
}: WelcomeEmailProps) {
  return (
    <Html lang="en">
      <Head />
      <Preview>
        Welcome to {gymName} — your {role} account is ready
      </Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Text style={headerTitle}>Welcome to {gymName}!</Text>
            <Text style={headerSubtitle}>
              Your account is set up and ready to go
            </Text>
          </Section>

          {/* Body */}
          <Section style={content}>
            <Text style={greetingText}>Hi {userName},</Text>
            <Text style={bodyText}>
              Your <strong>{role}</strong> account for <strong>{gymName}</strong>{' '}
              on Centric Fit has been successfully created. You&apos;re all set
              to start managing your fitness business.
            </Text>

            {/* Getting started steps */}
            <Section style={stepsSection}>
              <Text style={stepsTitle}>Getting Started</Text>
              <Hr style={divider} />
              <Text style={stepText}>
                <strong>1.</strong> Log in to your dashboard
              </Text>
              <Text style={stepText}>
                <strong>2.</strong> Complete your gym profile
              </Text>
              <Text style={stepText}>
                <strong>3.</strong> Add your first members
              </Text>
              <Text style={stepText}>
                <strong>4.</strong> Invite your team
              </Text>
            </Section>

            {/* CTA */}
            <Section style={ctaSection}>
              <Button href={dashboardUrl} style={ctaButton}>
                Go to Dashboard
              </Button>
            </Section>

            <Text style={bodyText}>
              If you have any questions, reach out to our support team — we&apos;re
              here to help you succeed.
            </Text>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              Centric Fit &mdash; Gym Management Platform
            </Text>
            <Text style={footerText}>
              You received this email because a new account was created for you.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

const main: React.CSSProperties = {
  backgroundColor: '#f8fafc',
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
}
const container: React.CSSProperties = {
  maxWidth: '600px',
  margin: '0 auto',
  backgroundColor: '#ffffff',
}
const header: React.CSSProperties = {
  background: 'linear-gradient(135deg, #3B82F6 0%, #10B981 100%)',
  padding: '40px 30px',
  textAlign: 'center',
}
const headerTitle: React.CSSProperties = {
  margin: 0,
  fontSize: '28px',
  fontWeight: 700,
  color: '#ffffff',
}
const headerSubtitle: React.CSSProperties = {
  margin: '8px 0 0',
  fontSize: '16px',
  color: 'rgba(255,255,255,0.9)',
}
const content: React.CSSProperties = { padding: '40px 30px' }
const greetingText: React.CSSProperties = { fontSize: '18px', marginBottom: '16px' }
const bodyText: React.CSSProperties = { fontSize: '16px', lineHeight: 1.6, color: '#374151' }
const stepsSection: React.CSSProperties = {
  background: '#f9fafb',
  borderRadius: '8px',
  padding: '20px',
  margin: '24px 0',
}
const stepsTitle: React.CSSProperties = { fontWeight: 700, color: '#1f2937', marginTop: 0 }
const divider: React.CSSProperties = { borderColor: '#e5e7eb', margin: '6px 0' }
const stepText: React.CSSProperties = { fontSize: '15px', color: '#374151', margin: '10px 0' }
const ctaSection: React.CSSProperties = { textAlign: 'center', margin: '32px 0' }
const ctaButton: React.CSSProperties = {
  background: 'linear-gradient(135deg, #3B82F6, #10B981)',
  color: '#ffffff',
  textDecoration: 'none',
  padding: '16px 32px',
  borderRadius: '8px',
  fontWeight: 600,
  fontSize: '16px',
}
const footer: React.CSSProperties = {
  background: '#f9fafb',
  padding: '30px',
  textAlign: 'center',
  borderTop: '1px solid #e5e7eb',
}
const footerText: React.CSSProperties = { color: '#6b7280', fontSize: '14px', margin: '8px 0' }
