// Default template configurations
export const EMAIL_TEMPLATE_DEFAULTS = {
  welcome: {
    name: 'Welcome Email',
    subject: 'Welcome to Room For You 🏠',
    description: 'Sent when someone joins the community',
  },
  devotional: {
    name: 'Daily Word',
    subject: "Today's Word — {{reference}}",
    description: 'Sent every morning with the daily scripture',
  },
  event_reminder: {
    name: 'Event Reminder',
    subject: 'Reminder: {{event_title}} is coming up',
    description: 'Sent 1 week and 24 hours before an event',
  },
  event_registration: {
    name: 'Event Registration',
    subject: "You're registered for {{event_title}}",
    description: 'Sent when someone registers for an event',
  },
  prayer_reply: {
    name: 'Prayer Reply',
    subject: 'Re: Your Prayer Request — {{subject}}',
    description: 'Sent when admin replies to a prayer request',
  },
  partner_confirmation: {
    name: 'Partner Confirmation',
    subject: 'Thank you for partnering with Room For You',
    description: 'Sent after a successful giving transaction',
  },
  contact_reply: {
    name: 'Contact Auto-Reply',
    subject: 'We received your message — Room For You',
    description: 'Sent when someone submits the contact form',
  },
  unsubscribe: {
    name: 'Unsubscribe Confirmation',
    subject: 'You have been unsubscribed',
    description: 'Sent when someone unsubscribes from emails',
  },
} as const

export type EmailTemplateKey = keyof typeof EMAIL_TEMPLATE_DEFAULTS

// Base Unlayer design template for all RFY emails
export function getBaseDesign(content: {
  preheader?: string
  heading: string
  body: string
  ctaText?: string
  ctaUrl?: string
  footerText?: string
}) {
  return {
    counters: {
      u_column: 5,
      u_row: 8,
      u_content_text: 6,
      u_content_image: 2,
      u_content_button: 1,
      u_content_divider: 2,
    },
    body: {
      id: 'rfy-base',
      rows: [
        {
          id: 'header-row',
          cells: [1],
          columns: [
            {
              id: 'header-col',
              contents: [
                {
                  id: 'logo',
                  type: 'image',
                  values: {
                    src: {
                      url: 'https://rfyglobal.org/images/logo-white.png',
                      width: 200,
                      height: 80,
                    },
                    textAlign: 'center',
                    linkHref: {
                      name: 'web',
                      values: { href: 'https://rfyglobal.org', target: '_blank' },
                    },
                    containerPadding: '24px 40px',
                  },
                },
              ],
              values: { backgroundColor: '#0F0F0F', padding: '0px' },
            },
          ],
          values: { backgroundColor: '#0F0F0F', padding: '0px' },
        },
        {
          id: 'divider-row',
          cells: [1],
          columns: [
            {
              id: 'divider-col',
              contents: [
                {
                  id: 'top-divider',
                  type: 'divider',
                  values: {
                    width: '100%',
                    border: {
                      borderTopWidth: '3px',
                      borderTopStyle: 'solid',
                      borderTopColor: '#8B0000',
                    },
                    containerPadding: '0px',
                  },
                },
              ],
              values: { backgroundColor: '#0F0F0F', padding: '0px' },
            },
          ],
          values: { backgroundColor: '#0F0F0F', padding: '0px' },
        },
        {
          id: 'content-row',
          cells: [1],
          columns: [
            {
              id: 'content-col',
              contents: [
                {
                  id: 'heading',
                  type: 'text',
                  values: {
                    text: `<h1 style="font-family: Georgia, serif; font-size: 32px; font-weight: 700; color: #F8F8F8; margin: 0 0 16px 0; line-height: 1.2;">${content.heading}</h1>`,
                    containerPadding: '40px 40px 0px',
                  },
                },
                {
                  id: 'body',
                  type: 'text',
                  values: {
                    text: `<p style="font-family: Arial, sans-serif; font-size: 15px; line-height: 1.8; color: #A0A0A0; margin: 0;">${content.body}</p>`,
                    containerPadding: '16px 40px 32px',
                  },
                },
                ...(content.ctaText && content.ctaUrl
                  ? [
                      {
                        id: 'cta',
                        type: 'button' as const,
                        values: {
                          text: content.ctaText,
                          href: {
                            name: 'web',
                            values: { href: content.ctaUrl, target: '_blank' },
                          },
                          buttonColors: {
                            color: '#0F0F0F',
                            backgroundColor: '#8B0000',
                            hoverColor: '#0F0F0F',
                            hoverBackgroundColor: '#A00000',
                          },
                          size: { autoWidth: false, width: '200px' },
                          textAlign: 'left',
                          containerPadding: '0px 40px 40px',
                          fontFamily: {
                            label: 'Arial',
                            value: 'Arial, Helvetica, sans-serif',
                          },
                          fontSize: '13px',
                          fontWeight: '700',
                          letterSpacing: '2px',
                          lineHeight: '120%',
                          padding: '14px 24px',
                          borderRadius: '0px',
                        },
                      },
                    ]
                  : []),
              ],
              values: { backgroundColor: '#1A1A1A', padding: '0px' },
            },
          ],
          values: { backgroundColor: '#0F0F0F', padding: '0px 0px 0px' },
        },
        {
          id: 'bottom-divider-row',
          cells: [1],
          columns: [
            {
              id: 'bottom-divider-col',
              contents: [
                {
                  id: 'bottom-divider',
                  type: 'divider',
                  values: {
                    width: '100%',
                    border: {
                      borderTopWidth: '1px',
                      borderTopStyle: 'solid',
                      borderTopColor: '#8B0000',
                    },
                    containerPadding: '0px',
                  },
                },
              ],
              values: { backgroundColor: '#0F0F0F', padding: '0px' },
            },
          ],
          values: { backgroundColor: '#0F0F0F', padding: '0px' },
        },
        {
          id: 'footer-row',
          cells: [1],
          columns: [
            {
              id: 'footer-col',
              contents: [
                {
                  id: 'footer-text',
                  type: 'text',
                  values: {
                    text: `<p style="font-family: Arial, sans-serif; font-size: 11px; color: #585858; text-align: center; margin: 0; letter-spacing: 0.1em;">${content.footerText ?? 'Room For You · rfyglobal.org · Jesus to Nations'}</p><p style="font-family: Arial, sans-serif; font-size: 11px; color: #585858; text-align: center; margin: 8px 0 0 0;"><a href="{{unsubscribe_url}}" style="color: #585858; text-decoration: underline;">Unsubscribe</a></p>`,
                    containerPadding: '24px 40px',
                  },
                },
              ],
              values: { backgroundColor: '#0F0F0F', padding: '0px' },
            },
          ],
          values: { backgroundColor: '#0F0F0F', padding: '0px' },
        },
      ],
      values: {
        backgroundColor: '#0F0F0F',
        backgroundImage: {
          url: '',
          fullWidth: false,
          repeat: 'no-repeat',
          size: 'custom',
          position: 'center',
        },
        contentWidth: '600px',
        contentAlign: 'center',
        fontFamily: { label: 'Arial', value: 'Arial, Helvetica, sans-serif' },
        preheaderText: content.preheader ?? '',
      },
    },
  }
}
