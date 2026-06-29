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

export interface InvitationEmailProps {
  recipientName?: string
  inviterName: string
  gymName: string
  role: string
  inviteUrl: string
  expiresAt: string
  message?: string
  recipientEmail: string
}

const ROLE_COLORS: Record<string, string> = {
  owner: '#8B5CF6',
  manager: '#3B82F6',
  trainer: '#F59E0B',
  member: '#6B7280',
}

export default function InvitationEmail({
  recipientName,
  inviterName,
  gymName,
  role,
  inviteUrl,
  expiresAt,
  message,
  recipientEmail,
}: InvitationEmailProps) {
  const greeting = recipientName ? `Hi ${recipientName}` : 'Hi there'
  const expireDate = new Date(expiresAt).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  const roleColor = ROLE_COLORS[role] ?? ROLE_COLORS.member

  return (
    <Html lang="en">
      <Head />
      <Preview>
        {inviterName} has invited you to join {gymName} as {role}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Text style={headerTitle}>You&apos;re Invited!</Text>
            <Text style={headerSubtitle}>
              Join {gymName} and become part of the team
            </Text>
          </Section>

          {/* Body */}
          <Section style={content}>
            <Text style={greetingText}>{greeting},</Text>
            <Text style={bodyText}>
              <strong>{inviterName}</strong> has invited you to join{' '}
              <strong>{gymName}</strong> as a team member.
            </Text>

            {/* Role badge */}
            <Section style={card}>
              <Text style={label}>Your Role:</Text>
              <Text style={{ ...roleBadge, backgroundColor: roleColor }}>
                {role}
              </Text>

              {message && (
                <Section style={messageBox}>
                  <Text style={label}>
                    Personal message from {inviterName}:
                  </Text>
                  <Text style={italicText}>&ldquo;{message}&rdquo;</Text>
                </Section>
              )}
            </Section>

            {/* CTA */}
            <Section style={ctaSection}>
              <Button href={inviteUrl} style={ctaButton}>
                Accept Invitation &amp; Join Team
              </Button>
            </Section>

            {/* Details */}
            <Section style={detailsSection}>
              <Text style={detailsTitle}>Invitation Details</Text>
              <Hr style={divider} />
              <Text style={detailRow}>
                <span style={detailLabel}>Gym:</span>{' '}
                <span style={detailValue}>{gymName}</span>
              </Text>
              <Hr style={divider} />
              <Text style={detailRow}>
                <span style={detailLabel}>Role:</span>{' '}
                <span style={detailValue}>{role}</span>
              </Text>
              <Hr style={divider} />
              <Text style={detailRow}>
                <span style={detailLabel}>Invited by:</span>{' '}
                <span style={detailValue}>{inviterName}</span>
              </Text>
              <Hr style={divider} />
              <Text style={detailRow}>
                <span style={detailLabel}>Email:</span>{' '}
                <span style={detailValue}>{recipientEmail}</span>
              </Text>
              <Hr style={divider} />
              <Text style={detailRow}>
                <span style={detailLabel}>Expires:</span>{' '}
                <span style={detailValue}>{expireDate}</span>
              </Text>
            </Section>

            {/* Security note */}
            <Section style={securityNote}>
              <Text style={securityText}>
                <strong>Security Note:</strong> This invitation expires on{' '}
                {expireDate}. If you didn&apos;t expect this, you can safely
                ignore this email.
              </Text>
            </Section>

            <Text style={manualLinkText}>
              Having trouble? Copy and paste this link into your browser:{' '}
              <a href={inviteUrl} style={{ color: '#3B82F6' }}>
                {inviteUrl}
              </a>
            </Text>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              Centric Fit &mdash; Gym Management Platform
            </Text>
            <Text style={footerText}>
              This email was sent because {inviterName} invited you to join{' '}
              {gymName}.
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
const greetingText: React.CSSProperties = { fontSize: '18px', marginBottom: '24px' }
const bodyText: React.CSSProperties = { fontSize: '16px', lineHeight: 1.6, color: '#374151' }
const card: React.CSSProperties = {
  background: '#f8fafc',
  border: '2px solid #e5e7eb',
  borderRadius: '12px',
  padding: '24px',
  margin: '24px 0',
}
const label: React.CSSProperties = { fontWeight: 600, color: '#374151', margin: '0 0 4px' }
const roleBadge: React.CSSProperties = {
  display: 'inline-block',
  color: '#ffffff',
  padding: '6px 12px',
  borderRadius: '20px',
  fontSize: '14px',
  fontWeight: 600,
  textTransform: 'capitalize',
}
const messageBox: React.CSSProperties = {
  background: '#ffffff',
  border: '1px solid #d1d5db',
  borderRadius: '8px',
  padding: '16px',
  marginTop: '16px',
}
const italicText: React.CSSProperties = { fontStyle: 'italic', color: '#4b5563' }
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
const detailsSection: React.CSSProperties = {
  background: '#f9fafb',
  borderRadius: '8px',
  padding: '20px',
  margin: '24px 0',
}
const detailsTitle: React.CSSProperties = { fontWeight: 700, color: '#1f2937', marginTop: 0 }
const divider: React.CSSProperties = { borderColor: '#e5e7eb', margin: '6px 0' }
const detailRow: React.CSSProperties = { margin: '4px 0', fontSize: '14px' }
const detailLabel: React.CSSProperties = { fontWeight: 600, color: '#374151' }
const detailValue: React.CSSProperties = { color: '#6b7280' }
const securityNote: React.CSSProperties = {
  background: '#fef3c7',
  border: '1px solid #f59e0b',
  borderRadius: '6px',
  padding: '12px',
  margin: '20px 0',
}
const securityText: React.CSSProperties = { fontSize: '14px', color: '#92400e', margin: 0 }
const manualLinkText: React.CSSProperties = { fontSize: '14px', color: '#6b7280', marginTop: '24px' }
const footer: React.CSSProperties = {
  background: '#f9fafb',
  padding: '30px',
  textAlign: 'center',
  borderTop: '1px solid #e5e7eb',
}
const footerText: React.CSSProperties = { color: '#6b7280', fontSize: '14px', margin: '8px 0' }
