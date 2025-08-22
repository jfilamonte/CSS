import { Resend } from "resend"

function getResendClient() {
  if (typeof window !== "undefined") {
    // Client-side, return null
    return null
  }

  if (process.env.NODE_ENV === "development" && !process.env.RESEND_API_KEY_CSS) {
    console.warn("RESEND_API_KEY_CSS not found in development")
    return null
  }

  if (!process.env.RESEND_API_KEY_CSS) {
    return null
  }

  return new Resend(process.env.RESEND_API_KEY_CSS)
}

export async function sendQuoteNotification(quoteData: any) {
  try {
    const resend = getResendClient()

    if (!resend) {
      console.warn("Resend not configured - skipping email notification")
      return { success: false, error: "Email service not configured" }
    }

    const { data, error } = await resend.emails.send({
      from: "Crafted Flooring Solutions <noreply@craftedflooringsolutions.com>",
      to: ["sales@craftedflooringsolutions.com"],
      subject: `New Quote Request - ${quoteData.projectType}`,
      html: `
        <h2>New Quote Request</h2>
        <p><strong>Customer:</strong> ${quoteData.firstName} ${quoteData.lastName}</p>
        <p><strong>Email:</strong> ${quoteData.email}</p>
        <p><strong>Phone:</strong> ${quoteData.phone}</p>
        <p><strong>Project Type:</strong> ${quoteData.projectType}</p>
        <p><strong>Square Footage:</strong> ${quoteData.squareFootage}</p>
        <p><strong>Estimated Cost:</strong> $${quoteData.estimatedCost}</p>
        <p><strong>Timeline:</strong> ${quoteData.timeline}</p>
        <p><strong>Address:</strong> ${quoteData.address}</p>
        ${quoteData.description ? `<p><strong>Description:</strong> ${quoteData.description}</p>` : ""}
        ${quoteData.appointmentDate ? `<p><strong>Appointment Requested:</strong> ${quoteData.appointmentDate} at ${quoteData.appointmentTime}</p>` : ""}
      `,
    })

    if (error) {
      console.error("Error sending quote notification:", error)
      return { success: false, error }
    }

    return { success: true, data }
  } catch (error) {
    console.error("Error sending quote notification:", error)
    return { success: false, error }
  }
}

export async function sendQuoteConfirmation(customerEmail: string, quoteData: any) {
  try {
    const resend = getResendClient()

    if (!resend) {
      console.warn("Resend not configured - skipping customer confirmation email")
      return { success: false, error: "Email service not configured" }
    }

    const { data, error } = await resend.emails.send({
      from: "Crafted Flooring Solutions <noreply@craftedflooringsolutions.com>",
      to: [customerEmail],
      subject: "Quote Request Received - Crafted Flooring Solutions",
      html: `
        <h2>Thank you for your quote request!</h2>
        <p>Dear ${quoteData.firstName},</p>
        <p>We've received your quote request for ${quoteData.projectType} and will get back to you within 24 hours.</p>
        <p><strong>Project Details:</strong></p>
        <ul>
          <li>Project Type: ${quoteData.projectType}</li>
          <li>Square Footage: ${quoteData.squareFootage}</li>
          <li>Estimated Cost: $${quoteData.estimatedCost}</li>
          <li>Timeline: ${quoteData.timeline}</li>
        </ul>
        ${quoteData.appointmentDate ? `<p>We'll also contact you to confirm your appointment on ${quoteData.appointmentDate} at ${quoteData.appointmentTime}.</p>` : ""}
        <p>Best regards,<br>Crafted Flooring Solutions Team</p>
      `,
    })

    if (error) {
      console.error("Error sending quote confirmation:", error)
      return { success: false, error }
    }

    return { success: true, data }
  } catch (error) {
    console.error("Error sending quote confirmation:", error)
    return { success: false, error }
  }
}

export async function sendTimeOffNotification(timeOffData: any) {
  try {
    const resend = getResendClient()

    if (!resend) {
      console.warn("Resend not configured - skipping time off notification")
      return { success: false, error: "Email service not configured" }
    }

    const { data, error } = await resend.emails.send({
      from: "Crafted Flooring Solutions <noreply@craftedflooringsolutions.com>",
      to: ["sales@craftedflooringsolutions.com"],
      subject: `Time Off Request - ${timeOffData.salesRepName}`,
      html: `
        <h2>Time Off Request</h2>
        <p><strong>Sales Rep:</strong> ${timeOffData.salesRepName}</p>
        <p><strong>Start Date:</strong> ${timeOffData.startDate}</p>
        <p><strong>End Date:</strong> ${timeOffData.endDate}</p>
        <p><strong>Reason:</strong> ${timeOffData.reason}</p>
        <p><strong>Status:</strong> ${timeOffData.status}</p>
      `,
    })

    if (error) {
      console.error("Error sending time off notification:", error)
      return { success: false, error }
    }

    return { success: true, data }
  } catch (error) {
    console.error("Error sending time off notification:", error)
    return { success: false, error }
  }
}

async function sendAppointmentUpdateNotification(appointmentId: string, emailData: any) {
  try {
    const resend = getResendClient()

    if (!resend) {
      console.warn("Resend not configured - skipping appointment update notification")
      return { success: false, error: "Email service not configured" }
    }

    const { data, error } = await resend.emails.send({
      from: "Crafted Flooring Solutions <noreply@craftedflooringsolutions.com>",
      to: ["sales@craftedflooringsolutions.com"],
      subject: `Appointment Update - ${emailData.customerName}`,
      html: `
        <h2>Appointment Update</h2>
        <p><strong>Appointment ID:</strong> ${appointmentId}</p>
        <p><strong>Customer:</strong> ${emailData.customerName}</p>
        <p><strong>Email:</strong> ${emailData.customerEmail}</p>
        <p><strong>Date:</strong> ${emailData.appointmentDate}</p>
        <p><strong>Time:</strong> ${emailData.appointmentTime}</p>
        ${emailData.salesRepName ? `<p><strong>Sales Rep:</strong> ${emailData.salesRepName}</p>` : ""}
        ${emailData.salesRepEmail ? `<p><strong>Sales Rep Email:</strong> ${emailData.salesRepEmail}</p>` : ""}
      `,
    })

    if (error) {
      console.error("Error sending appointment update notification:", error)
      return { success: false, error }
    }

    return { success: true, data }
  } catch (error) {
    console.error("Error sending appointment update notification:", error)
    return { success: false, error }
  }
}

export const emailService = {
  sendAppointmentUpdateNotification,
  sendQuoteNotification,
  sendQuoteConfirmation,
  sendTimeOffNotification,
}
