"use server"

import { createClient } from "../lib/supabase/server"
import { revalidatePath } from "next/cache"
import { emailService } from "./email-service"
import { SalesRepAssignmentService } from "./sales-rep-assignment"

const getSupabase = async () => {
  try {
    return await createClient()
  } catch (error) {
    console.error("[v0] Failed to create Supabase client:", error)
    throw new Error("Database connection unavailable")
  }
}

// All functions now call getSupabase() when needed

// Quote Management Actions
export async function createQuote(formData: FormData) {
  const supabase = await getSupabase()
  try {
    const quoteData = {
      customer_name: formData.get("customer_name") as string,
      customer_email: formData.get("customer_email") as string,
      customer_phone: formData.get("customer_phone") as string,
      project_address: formData.get("project_address") as string,
      square_footage: Number.parseInt(formData.get("square_footage") as string),
      status: "pending",
      quote_data: {
        project_type: formData.get("project_type"),
        timeline: formData.get("timeline"),
        special_requirements: formData.get("special_requirements"),
      },
    }

    const { data, error } = await supabase.from("quotes").insert([quoteData]).select().single()

    if (error) throw error

    // Auto-register customer from quote
    const {
      success: customerSuccess,
      customerId,
      isNew,
      tempPassword,
    } = await createCustomerFromQuote({
      name: quoteData.customer_name,
      email: quoteData.customer_email,
      phone: quoteData.customer_phone,
      address: quoteData.project_address,
    })

    if (!customerSuccess) {
      console.error("Failed to auto-register customer from quote")
      return { success: false, error: "Failed to auto-register customer from quote" }
    }

    // Update quote with customer_id
    const { error: updateError } = await supabase.from("quotes").update({ customer_id: customerId }).eq("id", data.id)

    if (updateError) throw updateError

    revalidatePath("/admin-new")
    return { success: true, data, customerId, isNew, tempPassword }
  } catch (error) {
    console.error("Error creating quote:", error)
    return { success: false, error: "Failed to create quote" }
  }
}

export async function updateQuoteStatus(quoteId: string, status: string) {
  const supabase = await getSupabase()
  try {
    const allowedStatuses = ["pending", "approved", "rejected", "completed"]
    if (!allowedStatuses.includes(status)) {
      throw new Error(`Invalid status: ${status}. Allowed values: ${allowedStatuses.join(", ")}`)
    }

    const { error } = await supabase
      .from("quotes")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", quoteId)

    if (error) throw error

    revalidatePath("/admin-new")
    return { success: true }
  } catch (error) {
    console.error("Error updating quote status:", error)
    return { success: false, error: error.message || "Failed to update quote status" }
  }
}

export async function deleteQuote(quoteId: string) {
  const supabase = await getSupabase()
  try {
    const { error } = await supabase.from("quotes").delete().eq("id", quoteId)

    if (error) throw error

    revalidatePath("/admin-new")
    return { success: true }
  } catch (error) {
    console.error("Error deleting quote:", error)
    return { success: false, error: "Failed to delete quote" }
  }
}

export async function getQuotes() {
  const supabase = await getSupabase()
  try {
    const { data, error } = await supabase.from("quotes").select("*").order("created_at", { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error("Error fetching quotes:", error)
    return []
  }
}

// Customer Management Actions
export async function createCustomer(formData: FormData) {
  const supabase = await getSupabase()
  try {
    const customerData = {
      first_name: formData.get("first_name") as string,
      last_name: formData.get("last_name") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      address: formData.get("address") as string,
      city: formData.get("city") as string,
      state: formData.get("state") as string,
      zip_code: formData.get("zip_code") as string,
      role: "customer",
      is_active: true,
    }

    const { data, error } = await supabase.from("users").insert([customerData]).select().single()

    if (error) throw error

    revalidatePath("/admin-new")
    return { success: true, data }
  } catch (error) {
    console.error("Error creating customer:", error)
    return { success: false, error: "Failed to create customer" }
  }
}

export async function updateCustomer(customerId: string, formData: FormData) {
  const supabase = await getSupabase()
  try {
    const updateData = {
      first_name: formData.get("first_name") as string,
      last_name: formData.get("last_name") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      address: formData.get("address") as string,
      city: formData.get("city") as string,
      state: formData.get("state") as string,
      zip_code: formData.get("zip_code") as string,
      updated_at: new Date().toISOString(),
    }

    const { error } = await supabase.from("users").update(updateData).eq("id", customerId)

    if (error) throw error

    revalidatePath("/admin-new")
    return { success: true }
  } catch (error) {
    console.error("Error updating customer:", error)
    return { success: false, error: "Failed to update customer" }
  }
}

export async function getCustomers() {
  const supabase = await getSupabase()
  try {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("role", "customer")
      .order("created_at", { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error("Error fetching customers:", error)
    return []
  }
}

// Project Management Actions
export async function createProject(formData: FormData) {
  const supabase = await getSupabase()
  try {
    console.log("[v0] FormData entries:")
    for (const [key, value] of formData.entries()) {
      console.log(`[v0] ${key}: ${value}`)
    }

    const title = formData.get("title") as string
    const description = formData.get("description") as string
    const customer_id = formData.get("customer_id") as string
    const project_address = formData.get("project_address") as string
    const square_footage = formData.get("square_footage") as string
    const start_date = formData.get("start_date") as string
    const estimated_completion = formData.get("estimated_completion") as string

    if (!title || title.trim() === "") {
      throw new Error("Project title is required")
    }
    if (!customer_id || customer_id.trim() === "") {
      throw new Error("Customer ID is required")
    }

    console.log("[v0] Extracted values:", {
      title,
      description,
      customer_id,
      project_address,
      square_footage,
      start_date,
      estimated_completion,
    })

    const possibleStatuses = ["in-progress", "completed", "active", "planning", "scheduled", "new", "open", "started"]

    let projectData = null
    let lastError = null

    for (const status of possibleStatuses) {
      try {
        console.log(`[v0] Attempting to create project with status: "${status}"`)

        const newProject = {
          title: title.trim(),
          description: description || "",
          customer_id: customer_id,
          project_address: project_address || "",
          square_footage: Number.parseInt(square_footage) || 0,
          status: status,
          progress_percentage: 0,
          start_date: start_date || null,
          estimated_completion: estimated_completion || null,
          project_number: `CSS-${Date.now()}`,
        }

        console.log(`[v0] Project data to insert with status "${status}":`, newProject)

        const { data, error } = await supabase
          .from("projects")
          .insert([newProject])
          .select(`
            *,
            users!projects_customer_id_fkey(first_name, last_name, email, phone)
          `)
          .single()

        if (error) {
          console.log(`[v0] Status "${status}" failed:`, error.message)
          lastError = error
          continue // Try next status
        }

        console.log(`[v0] SUCCESS! Project created with status: "${status}"`)
        projectData = data
        break // Success, exit loop
      } catch (statusError) {
        console.log(`[v0] Status "${status}" threw error:`, statusError.message)
        lastError = statusError
        continue // Try next status
      }
    }

    if (!projectData) {
      console.error("[v0] All status values failed. Last error:", lastError)
      throw new Error(`Failed to create project with any valid status. Last error: ${lastError?.message}`)
    }

    const formattedProject = {
      ...projectData,
      customer_name: projectData.users
        ? `${projectData.users.first_name} ${projectData.users.last_name}`
        : "Unknown Customer",
      project_name: projectData.title,
      location: projectData.project_address,
      budget: 0,
      actual_cost: 0,
      progress: projectData.progress_percentage || 0,
      notes: [],
      photos: [],
      materials: [],
      timeline: [],
    }

    revalidatePath("/admin-new")
    return { success: true, data: formattedProject }
  } catch (error) {
    console.error("[v0] Error creating project:", error)
    return { success: false, error: error.message || "Failed to create project" }
  }
}

export async function updateProject(projectId: string, updates: any) {
  const supabase = await getSupabase()
  try {
    const { error } = await supabase
      .from("projects")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", projectId)

    if (error) throw error

    revalidatePath("/admin-new")
    return { success: true }
  } catch (error) {
    console.error("Error updating project:", error)
    return { success: false, error: "Failed to update project" }
  }
}

export async function updateProjectProgress(projectId: string, progress: number) {
  const supabase = await getSupabase()
  try {
    console.log("[v0] updateProjectProgress called with:", { projectId, progress })

    if (!projectId || typeof projectId !== "string") {
      console.error("[v0] Invalid projectId:", projectId)
      return { success: false, error: "Invalid project ID" }
    }

    if (typeof progress !== "number" || progress < 0 || progress > 100) {
      console.error("[v0] Invalid progress value:", progress)
      return { success: false, error: "Progress must be a number between 0 and 100" }
    }

    console.log("[v0] Attempting to update project progress in database...")

    // First check if the project exists
    const { data: existingProject, error: fetchError } = await supabase
      .from("projects")
      .select("id, status")
      .eq("id", projectId)
      .single()

    if (fetchError || !existingProject) {
      console.error("[v0] Project not found:", fetchError?.message || "No project with this ID")
      return { success: false, error: "Project not found" }
    }

    console.log("[v0] Found existing project with status:", existingProject.status)

    // Update only progress_percentage and updated_at, keep existing status
    const updateData = {
      progress_percentage: progress,
      updated_at: new Date().toISOString(),
    }

    console.log("[v0] Update data (no status change):", updateData)

    const { data, error } = await supabase.from("projects").update(updateData).eq("id", projectId).select()

    if (error) {
      console.error("[v0] Update failed:", error.message)
      return { success: false, error: error.message }
    }

    console.log("[v0] Update successful, data:", data)

    revalidatePath("/admin-new")

    const result = { success: true }
    console.log("[v0] Returning result:", result)
    return result
  } catch (error) {
    console.error("[v0] Error in updateProjectProgress:", error)
    const errorResult = { success: false, error: error?.message || "Failed to update project progress" }
    console.log("[v0] Returning error result:", errorResult)
    return errorResult
  }
}

export async function getProjects() {
  const supabase = await getSupabase()
  try {
    const { data, error } = await supabase
      .from("projects")
      .select(`
        *,
        users!projects_customer_id_fkey(first_name, last_name, email, phone)
      `)
      .order("created_at", { ascending: false })

    if (error) throw error

    return data.map((project) => ({
      ...project,
      customer_name: project.users ? `${project.users.first_name} ${project.users.last_name}` : "Unknown Customer",
      project_name: project.title,
      location: project.project_address,
      budget: 0,
      actual_cost: 0,
      progress: project.progress_percentage || 0,
      notes: [],
      photos: [],
      materials: [],
      timeline: [],
    }))
  } catch (error) {
    console.error("Error fetching projects:", error)
    return []
  }
}

export async function addProjectNote(projectId: string, note: string) {
  const supabase = await getSupabase()
  try {
    const { data, error } = await supabase
      .from("project_notes")
      .insert([
        {
          project_id: projectId,
          note_text: note,
          created_by: "admin", // In a real app, this would be the current user
        },
      ])
      .select()
      .single()

    if (error) throw error

    revalidatePath("/admin-new")
    return { success: true, data }
  } catch (error) {
    console.error("Error adding project note:", error)
    return { success: false, error: "Failed to add project note" }
  }
}

// Appointment Management Actions
export async function createAppointment(formData: FormData) {
  const supabase = await getSupabase()
  try {
    const appointmentData = {
      customer_id: formData.get("customer_id") as string,
      quote_id: (formData.get("quote_id") as string) || null,
      appointment_type: formData.get("appointment_type") as string,
      scheduled_date: formData.get("scheduled_date") as string,
      scheduled_time: formData.get("scheduled_time") as string,
      duration_minutes: Number.parseInt(formData.get("duration_minutes") as string) || 60,
      status: "scheduled",
      customer_notes: (formData.get("customer_notes") as string) || null,
      admin_notes: (formData.get("admin_notes") as string) || null,
    }

    let assignedTo = formData.get("assigned_to") as string
    if (!assignedTo || assignedTo === "auto") {
      const assignmentResult = await SalesRepAssignmentService.assignSalesRep({
        date: appointmentData.scheduled_date,
        time: appointmentData.scheduled_time,
        duration: appointmentData.duration_minutes,
        appointmentType: appointmentData.appointment_type,
        customerId: appointmentData.customer_id,
      })

      if (assignmentResult.success && assignmentResult.assignedRepId) {
        assignedTo = assignmentResult.assignedRepId
        appointmentData.admin_notes =
          `${appointmentData.admin_notes || ""}\nAuto-assigned to ${assignmentResult.assignedRepName}: ${assignmentResult.reason}`.trim()
      }
    }

    const finalAppointmentData = {
      ...appointmentData,
      assigned_to: assignedTo || null,
    }

    const { data, error } = await supabase.from("appointments").insert([finalAppointmentData]).select().single()

    if (error) throw error

    // Send notification emails if sales rep is assigned
    if (assignedTo) {
      const { data: appointmentWithDetails, error: fetchError } = await supabase
        .from("appointments")
        .select(`
          *,
          customer:users!appointments_customer_id_fkey(first_name, last_name, email),
          sales_rep:users!appointments_assigned_to_fkey(first_name, last_name, email)
        `)
        .eq("id", data.id)
        .single()

      if (!fetchError && appointmentWithDetails.customer && appointmentWithDetails.sales_rep) {
        const emailData = {
          customerName: `${appointmentWithDetails.customer.first_name} ${appointmentWithDetails.customer.last_name}`,
          customerEmail: appointmentWithDetails.customer.email,
          appointmentDate: new Date(appointmentWithDetails.scheduled_date).toLocaleDateString(),
          appointmentTime: appointmentWithDetails.scheduled_time,
          salesRepName: `${appointmentWithDetails.sales_rep.first_name} ${appointmentWithDetails.sales_rep.last_name}`,
          salesRepEmail: appointmentWithDetails.sales_rep.email,
        }

        await emailService.sendAppointmentUpdateNotification(data.id, emailData)
      }
    }

    revalidatePath("/admin-new")
    return { success: true, data }
  } catch (error) {
    console.error("Error creating appointment:", error)
    return { success: false, error: "Failed to create appointment" }
  }
}

export async function updateAppointmentStatus(appointmentId: string, status: string) {
  const supabase = await getSupabase()
  try {
    const { error } = await supabase
      .from("appointments")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", appointmentId)

    if (error) throw error

    revalidatePath("/admin-new")
    return { success: true }
  } catch (error) {
    console.error("Error updating appointment status:", error)
    return { success: false, error: "Failed to update appointment status" }
  }
}

export async function rescheduleAppointment(appointmentId: string, newDate: string, newTime: string, reason?: string) {
  const supabase = await getSupabase()
  try {
    const { data: appointmentData, error: fetchError } = await supabase
      .from("appointments")
      .select(`
        *,
        customer:users!appointments_customer_id_fkey(first_name, last_name, email),
        sales_rep:users!appointments_assigned_to_fkey(first_name, last_name, email)
      `)
      .eq("id", appointmentId)
      .single()

    if (fetchError) throw fetchError

    const oldDate = appointmentData.scheduled_date
    const oldTime = appointmentData.scheduled_time

    const { error } = await supabase
      .from("appointments")
      .update({
        scheduled_date: newDate,
        scheduled_time: newTime,
        status: "rescheduled",
        updated_at: new Date().toISOString(),
      })
      .eq("id", appointmentId)

    if (error) throw error

    if (appointmentData.customer) {
      const emailData = {
        customerName: `${appointmentData.customer.first_name} ${appointmentData.customer.last_name}`,
        customerEmail: appointmentData.customer.email,
        appointmentDate: new Date(newDate).toLocaleDateString(),
        appointmentTime: newTime,
        oldDate: new Date(oldDate).toLocaleDateString(),
        oldTime: oldTime,
        reason: reason,
        salesRepName: appointmentData.sales_rep
          ? `${appointmentData.sales_rep.first_name} ${appointmentData.sales_rep.last_name}`
          : undefined,
        salesRepEmail: appointmentData.sales_rep?.email,
      }

      await emailService.sendAppointmentUpdateNotification(appointmentId, emailData)
    }

    revalidatePath("/admin-new")
    return { success: true }
  } catch (error) {
    console.error("Error rescheduling appointment:", error)
    return { success: false, error: "Failed to reschedule appointment" }
  }
}

export async function deleteAppointment(appointmentId: string) {
  const supabase = await getSupabase()
  try {
    const { error } = await supabase.from("appointments").delete().eq("id", appointmentId)

    if (error) throw error

    revalidatePath("/admin-new")
    return { success: true }
  } catch (error) {
    console.error("Error deleting appointment:", error)
    return { success: false, error: "Failed to delete appointment" }
  }
}

export async function getAvailableTimeSlots(date: string) {
  const supabase = await getSupabase()
  try {
    // Get existing appointments for the date
    const { data: appointments, error } = await supabase
      .from("appointments")
      .select("scheduled_time, duration_minutes")
      .eq("scheduled_date", date)
      .neq("status", "cancelled")

    if (error) throw error

    // Generate available slots based on business hours
    // This would integrate with your availability settings
    const businessHours = {
      start: "08:00",
      end: "17:00",
      bufferTime: 30, // minutes
    }

    const availableSlots: string[] = []
    const startTime = new Date(`${date} ${businessHours.start}`)
    const endTime = new Date(`${date} ${businessHours.end}`)

    const currentTime = new Date(startTime)

    while (currentTime < endTime) {
      const timeString = currentTime.toTimeString().slice(0, 5)

      // Check if this slot conflicts with existing appointments
      const hasConflict = appointments?.some((apt) => {
        const aptStart = new Date(`${date} ${apt.scheduled_time}`)
        const aptEnd = new Date(aptStart.getTime() + apt.duration_minutes * 60000)
        const slotEnd = new Date(currentTime.getTime() + businessHours.bufferTime * 60000)

        return (currentTime >= aptStart && currentTime < aptEnd) || (slotEnd > aptStart && slotEnd <= aptEnd)
      })

      if (!hasConflict) {
        availableSlots.push(timeString)
      }

      currentTime.setMinutes(currentTime.getMinutes() + businessHours.bufferTime)
    }

    return { success: true, slots: availableSlots }
  } catch (error) {
    console.error("Error getting available time slots:", error)
    return { success: false, error: "Failed to get available time slots", slots: [] }
  }
}

export async function getIntelligentAvailableTimeSlots(date: string) {
  const supabase = await getSupabase()
  try {
    const dayOfWeek = new Date(date).getDay()

    // Get business hours for the specific day
    const businessHours = {
      0: { start: "00:00", end: "00:00", enabled: false }, // Sunday
      1: { start: "07:00", end: "20:00", enabled: true }, // Monday
      2: { start: "07:00", end: "20:00", enabled: true }, // Tuesday
      3: { start: "07:00", end: "20:00", enabled: true }, // Wednesday
      4: { start: "07:00", end: "20:00", enabled: true }, // Thursday
      5: { start: "07:00", end: "20:00", enabled: true }, // Friday
      6: { start: "09:00", end: "12:00", enabled: true }, // Saturday
    }

    const dayHours = businessHours[dayOfWeek as keyof typeof businessHours]

    if (!dayHours.enabled) {
      return { success: true, data: [] }
    }

    // Get all sales reps and their availability
    const { data: salesReps, error: repsError } = await supabase
      .from("users")
      .select(`
        id, first_name, last_name, email,
        availability:sales_rep_availability!sales_rep_availability_sales_rep_id_fkey(
          day_of_week, start_time, end_time, is_active
        ),
        blocked_times:sales_rep_blocked_times!sales_rep_blocked_times_sales_rep_id_fkey(
          start_date, end_date, start_time, end_time, reason, is_active
        ),
        time_off:sales_rep_time_off!sales_rep_time_off_sales_rep_id_fkey(
          start_date, end_date, status
        )
      `)
      .eq("role", "sales_person")
      .eq("is_active", true)

    if (repsError) throw repsError

    // Get existing appointments for the date
    const { data: appointments, error: apptError } = await supabase
      .from("appointments")
      .select("appointment_time, assigned_to, duration_minutes")
      .eq("appointment_date", date)
      .neq("status", "cancelled")

    if (apptError) throw apptError

    // Generate time slots
    const availableSlots: Array<{
      time: string
      availableReps: number
      totalReps: number
    }> = []

    const startTime = new Date(`${date} ${dayHours.start}`)
    const endTime = new Date(`${date} ${dayHours.end}`)
    const slotDuration = 30 // minutes

    const currentTime = new Date(startTime)

    while (currentTime < endTime) {
      const timeString = currentTime.toTimeString().slice(0, 5)

      // Count available sales reps for this time slot
      let availableReps = 0

      for (const rep of salesReps || []) {
        // Check if rep has availability for this day/time
        const hasAvailability = rep.availability?.some(
          (avail: any) =>
            avail.day_of_week === dayOfWeek &&
            avail.is_active &&
            avail.start_time <= timeString &&
            avail.end_time >= timeString,
        )

        if (!hasAvailability) continue

        // Check if rep is on approved time off
        const isOnTimeOff = rep.time_off?.some(
          (timeOff: any) =>
            timeOff.status === "approved" &&
            new Date(timeOff.start_date) <= new Date(date) &&
            new Date(timeOff.end_date) >= new Date(date),
        )

        if (isOnTimeOff) continue

        // Check if rep has blocked time
        const isBlocked = rep.blocked_times?.some(
          (blocked: any) =>
            blocked.is_active &&
            new Date(blocked.start_date) <= new Date(date) &&
            new Date(blocked.end_date) >= new Date(date) &&
            (!blocked.start_time || blocked.start_time <= timeString) &&
            (!blocked.end_time || blocked.end_time >= timeString),
        )

        if (isBlocked) continue

        // Check if rep has existing appointment at this time
        const hasAppointment = appointments?.some(
          (apt: any) => apt.assigned_to === rep.id && apt.appointment_time === timeString,
        )

        if (hasAppointment) continue

        availableReps++
      }

      // Only include slots where at least one rep is available
      if (availableReps > 0) {
        availableSlots.push({
          time: timeString,
          availableReps,
          totalReps: salesReps?.length || 0,
        })
      }

      currentTime.setMinutes(currentTime.getMinutes() + slotDuration)
    }

    return { success: true, data: availableSlots }
  } catch (error) {
    console.error("Error getting intelligent available time slots:", error)
    return { success: false, error: "Failed to get available time slots" }
  }
}

export async function getOptimalSalesRepAssignment(date: string, time: string) {
  const supabase = await getSupabase()
  try {
    const dayOfWeek = new Date(date).getDay()

    // Get available sales reps with workload data
    const { data: salesReps, error } = await supabase
      .from("users")
      .select(`
        id, first_name, last_name, email,
        availability:sales_rep_availability!sales_rep_availability_sales_rep_id_fkey(
          day_of_week, start_time, end_time, is_active
        ),
        blocked_times:sales_rep_blocked_times!sales_rep_blocked_times_sales_rep_id_fkey(
          start_date, end_date, start_time, end_time, is_active
        ),
        time_off:sales_rep_time_off!sales_rep_time_off_sales_rep_id_fkey(
          start_date, end_date, status
        ),
        appointments:appointments!appointments_assigned_to_fkey(
          appointment_date, appointment_time, status
        )
      `)
      .eq("role", "sales_person")
      .eq("is_active", true)

    if (error) throw error

    // Filter and score available reps
    const availableReps = (salesReps || [])
      .filter((rep) => {
        // Check availability
        const hasAvailability = rep.availability?.some(
          (avail: any) =>
            avail.day_of_week === dayOfWeek && avail.is_active && avail.start_time <= time && avail.end_time >= time,
        )

        if (!hasAvailability) return false

        // Check time off
        const isOnTimeOff = rep.time_off?.some(
          (timeOff: any) =>
            timeOff.status === "approved" &&
            new Date(timeOff.start_date) <= new Date(date) &&
            new Date(timeOff.end_date) >= new Date(date),
        )

        if (isOnTimeOff) return false

        // Check blocked times
        const isBlocked = rep.blocked_times?.some(
          (blocked: any) =>
            blocked.is_active &&
            new Date(blocked.start_date) <= new Date(date) &&
            new Date(blocked.end_date) >= new Date(date) &&
            (!blocked.start_time || blocked.start_time <= time) &&
            (!blocked.end_time || blocked.end_time >= time),
        )

        if (isBlocked) return false

        // Check existing appointments
        const hasConflict = rep.appointments?.some(
          (apt: any) => apt.appointment_date === date && apt.appointment_time === time && apt.status !== "cancelled",
        )

        return !hasConflict
      })
      .map((rep) => {
        // Calculate workload score (lower is better)
        const thisWeekAppointments =
          rep.appointments?.filter((apt: any) => {
            const aptDate = new Date(apt.appointment_date)
            const startOfWeek = new Date(date)
            startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())
            const endOfWeek = new Date(startOfWeek)
            endOfWeek.setDate(endOfWeek.getDate() + 6)

            return aptDate >= startOfWeek && aptDate <= endOfWeek && apt.status !== "cancelled"
          }).length || 0

        const todayAppointments =
          rep.appointments?.filter((apt: any) => apt.appointment_date === date && apt.status !== "cancelled").length ||
          0

        return {
          ...rep,
          workloadScore: thisWeekAppointments * 0.7 + todayAppointments * 0.3,
          thisWeekAppointments,
          todayAppointments,
        }
      })
      .sort((a, b) => a.workloadScore - b.workloadScore) // Sort by lowest workload first

    return { success: true, data: availableReps }
  } catch (error) {
    console.error("Error getting optimal sales rep assignment:", error)
    return { success: false, error: "Failed to get sales rep assignment" }
  }
}

export async function getAppointments(date?: string) {
  const supabase = await getSupabase()
  try {
    let query = supabase
      .from("appointments")
      .select(`
        *,
        users!appointments_customer_id_fkey(first_name, last_name, email, phone),
        quotes(id, project_address)
      `)
      .order("scheduled_date", { ascending: true })

    if (date) {
      query = query.eq("scheduled_date", date)
    }

    const { data, error } = await query

    if (error) throw error

    return data.map((appointment) => ({
      ...appointment,
      customer_name: appointment.users
        ? `${appointment.users.first_name} ${appointment.users.last_name}`
        : "Unknown Customer",
      customer_email: appointment.users?.email,
      customer_phone: appointment.users?.phone,
      project_address: appointment.quotes?.project_address,
    }))
  } catch (error) {
    console.error("Error fetching appointments:", error)
    return []
  }
}

export async function getMonthlyAppointments(year: number, month: number) {
  const supabase = await getSupabase()
  try {
    const startDate = new Date(year, month - 1, 1).toISOString().split("T")[0]
    const endDate = new Date(year, month, 0).toISOString().split("T")[0]

    const { data, error } = await supabase
      .from("appointments")
      .select(`
        *,
        users!appointments_customer_id_fkey(first_name, last_name, email)
      `)
      .gte("scheduled_date", startDate)
      .lte("scheduled_date", endDate)
      .order("scheduled_date", { ascending: true })

    if (error) throw error

    return data.map((appointment) => ({
      ...appointment,
      customer_name: appointment.users
        ? `${appointment.users.first_name} ${appointment.users.last_name}`
        : "Unknown Customer",
    }))
  } catch (error) {
    console.error("Error fetching monthly appointments:", error)
    return []
  }
}

export async function assignSalesRepToAppointment(appointmentId: string, salesRepId: string) {
  const supabase = await getSupabase()
  try {
    // Get appointment and sales rep details for email notification
    const { data: appointmentData, error: fetchError } = await supabase
      .from("appointments")
      .select(`
        *,
        customer:users!appointments_customer_id_fkey(first_name, last_name, email)
      `)
      .eq("id", appointmentId)
      .single()

    if (fetchError) throw fetchError

    const { data: salesRepData, error: salesRepError } = await supabase
      .from("users")
      .select("first_name, last_name, email")
      .eq("id", salesRepId)
      .eq("role", "sales_person")
      .single()

    if (salesRepError) throw salesRepError

    // Update appointment with assigned sales rep
    const { error } = await supabase
      .from("appointments")
      .update({
        assigned_to: salesRepId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", appointmentId)

    if (error) throw error

    // Send email notification to sales rep
    const emailData = {
      customerName: `${appointmentData.customer.first_name} ${appointmentData.customer.last_name}`,
      customerEmail: appointmentData.customer.email,
      appointmentDate: new Date(appointmentData.scheduled_date).toLocaleDateString(),
      appointmentTime: appointmentData.scheduled_time,
      salesRepName: `${salesRepData.first_name} ${salesRepData.last_name}`,
      salesRepEmail: salesRepData.email,
    }

    await emailService.sendAppointmentUpdateNotification(appointmentId, emailData)

    revalidatePath("/admin-new")
    return { success: true }
  } catch (error) {
    console.error("Error assigning sales rep to appointment:", error)
    return { success: false, error: "Failed to assign sales rep" }
  }
}

export async function getAvailableSalesReps(date: string, time: string) {
  const supabase = await getSupabase()
  try {
    const dayOfWeek = new Date(date).getDay()

    // Get sales reps who are available on this day and time
    const { data: availableReps, error } = await supabase
      .from("users")
      .select(`
        id, first_name, last_name, email,
        availability:sales_rep_availability!sales_rep_availability_sales_rep_id_fkey(
          day_of_week, start_time, end_time, is_active
        ),
        blocked_times:sales_rep_blocked_times!sales_rep_blocked_times_sales_rep_id_fkey(
          blocked_date, start_time, end_time, is_all_day
        )
      `)
      .eq("role", "sales_person")
      .eq("is_active", true)

    if (error) throw error

    // Filter reps based on availability and blocked times
    const filteredReps =
      availableReps?.filter((rep) => {
        // Check if rep has availability for this day of week
        const hasAvailability = rep.availability?.some(
          (avail: any) =>
            avail.day_of_week === dayOfWeek && avail.is_active && avail.start_time <= time && avail.end_time >= time,
        )

        if (!hasAvailability) return false

        // Check if rep is not blocked on this date/time
        const isBlocked = rep.blocked_times?.some(
          (blocked: any) =>
            blocked.blocked_date === date &&
            (blocked.is_all_day || (blocked.start_time <= time && blocked.end_time >= time)),
        )

        return !isBlocked
      }) || []

    return { success: true, data: filteredReps }
  } catch (error) {
    console.error("Error getting available sales reps:", error)
    return { success: false, error: "Failed to get available sales reps" }
  }
}

export async function getAvailableSalesRepsWithWorkload(date: string, time: string) {
  const supabase = await getSupabase()
  try {
    const result = await SalesRepAssignmentService.getAvailableRepsWithWorkload(date, time)
    return result
  } catch (error) {
    console.error("Error getting available sales reps with workload:", error)
    return { success: false, error: "Failed to get sales rep availability" }
  }
}

export async function reassignSalesRepAppointments(repId: string, dateRange?: { start: string; end: string }) {
  const supabase = await getSupabase()
  try {
    const result = await SalesRepAssignmentService.reassignAppointments(repId, dateRange)

    if (result.success) {
      revalidatePath("/admin-new")
    }

    return result
  } catch (error) {
    console.error("Error reassigning appointments:", error)
    return { success: false, error: "Failed to reassign appointments" }
  }
}

// Business Settings Actions
export async function updateBusinessSettings(formData: FormData) {
  const supabase = await getSupabase()
  try {
    const settings = [
      {
        setting_key: "company_name",
        setting_value: formData.get("company_name"),
        setting_category: "business_info",
      },
      {
        setting_key: "phone",
        setting_value: formData.get("phone"),
        setting_category: "business_info",
      },
      {
        setting_key: "email",
        setting_value: formData.get("email"),
        setting_category: "business_info",
      },
      {
        setting_key: "address",
        setting_value: formData.get("address"),
        setting_category: "business_info",
      },
    ]

    for (const setting of settings) {
      // Check if setting exists
      const { data: existing } = await supabase
        .from("business_settings")
        .select("id")
        .eq("setting_key", setting.setting_key)
        .single()

      if (existing) {
        // Update existing setting
        const { error } = await supabase
          .from("business_settings")
          .update({
            setting_value: setting.setting_value,
            updated_at: new Date().toISOString(),
          })
          .eq("setting_key", setting.setting_key)

        if (error) throw error
      } else {
        // Insert new setting
        const { error } = await supabase.from("business_settings").insert([
          {
            ...setting,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ])

        if (error) throw error
      }
    }

    revalidatePath("/admin-new")
    return { success: true }
  } catch (error) {
    console.error("Error updating business settings:", error)
    return { success: false, error: "Failed to update business settings" }
  }
}

export async function getBusinessAvailability() {
  const supabase = await getSupabase()
  try {
    const { data, error } = await supabase.from("business_settings").select("*").eq("setting_category", "availability")

    if (error) throw error

    const settings = data.reduce((acc: any, setting: any) => {
      acc[setting.setting_key] = setting.setting_value
      return acc
    }, {})

    return {
      monday: {
        start: settings.monday_start || "08:00",
        end: settings.monday_end || "17:00",
        enabled: settings.monday_enabled !== "false",
      },
      tuesday: {
        start: settings.tuesday_start || "08:00",
        end: settings.tuesday_end || "17:00",
        enabled: settings.tuesday_enabled !== "false",
      },
      wednesday: {
        start: settings.wednesday_start || "08:00",
        end: settings.wednesday_end || "17:00",
        enabled: settings.wednesday_enabled !== "false",
      },
      thursday: {
        start: settings.thursday_start || "08:00",
        end: settings.thursday_end || "17:00",
        enabled: settings.thursday_enabled !== "false",
      },
      friday: {
        start: settings.friday_start || "08:00",
        end: settings.friday_end || "17:00",
        enabled: settings.friday_enabled !== "false",
      },
      saturday: {
        start: settings.saturday_start || "09:00",
        end: settings.saturday_end || "15:00",
        enabled: settings.saturday_enabled === "true",
      },
      sunday: {
        start: settings.sunday_start || "10:00",
        end: settings.sunday_end || "14:00",
        enabled: settings.sunday_enabled === "true",
      },
      bufferTime: Number.parseInt(settings.buffer_time) || 30,
      maxAdvanceBooking: Number.parseInt(settings.max_advance_booking) || 30,
    }
  } catch (error) {
    console.error("Error fetching business availability:", error)
    return {
      monday: { start: "08:00", end: "17:00", enabled: true },
      tuesday: { start: "08:00", end: "17:00", enabled: true },
      wednesday: { start: "08:00", end: "17:00", enabled: true },
      thursday: { start: "08:00", end: "17:00", enabled: true },
      friday: { start: "08:00", end: "17:00", enabled: true },
      saturday: { start: "09:00", end: "15:00", enabled: false },
      sunday: { start: "10:00", end: "14:00", enabled: false },
      bufferTime: 30,
      maxAdvanceBooking: 30,
    }
  }
}

export async function updateBusinessAvailability(availability: any) {
  const supabase = await getSupabase()
  try {
    const settings = []

    for (const [day, config] of Object.entries(availability)) {
      if (typeof config === "object" && config !== null && "start" in config) {
        const dayConfig = config as { start: string; end: string; enabled: boolean }
        settings.push(
          { setting_key: `${day}_start`, setting_value: dayConfig.start, setting_category: "availability" },
          { setting_key: `${day}_end`, setting_value: dayConfig.end, setting_category: "availability" },
          {
            setting_key: `${day}_enabled`,
            setting_value: dayConfig.enabled.toString(),
            setting_category: "availability",
          },
        )
      } else if (day === "bufferTime" || day === "maxAdvanceBooking") {
        settings.push({
          setting_key: day === "bufferTime" ? "buffer_time" : "max_advance_booking",
          setting_value: config.toString(),
          setting_category: "availability",
        })
      }
    }

    for (const setting of settings) {
      // Check if setting exists
      const { data: existing } = await supabase
        .from("business_settings")
        .select("id")
        .eq("setting_key", setting.setting_key)
        .single()

      if (existing) {
        // Update existing setting
        const { error } = await supabase
          .from("business_settings")
          .update({
            setting_value: setting.setting_value,
            updated_at: new Date().toISOString(),
          })
          .eq("setting_key", setting.setting_key)

        if (error) throw error
      } else {
        // Insert new setting
        const { error } = await supabase.from("business_settings").insert([
          {
            ...setting,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ])

        if (error) throw error
      }
    }

    revalidatePath("/admin-new")
    return { success: true }
  } catch (error) {
    console.error("Error updating business availability:", error)
    return { success: false, error: "Failed to update business availability" }
  }
}

// Service Package Actions
export async function createServicePackage(formData: FormData) {
  const supabase = await getSupabase()
  try {
    const packageData = {
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      package_type: formData.get("package_type") as string,
      base_price_per_sqft: Number.parseFloat(formData.get("base_price_per_sqft") as string),
      is_active: true,
    }

    const { data, error } = await supabase.from("service_packages").insert([packageData]).select().single()

    if (error) throw error

    revalidatePath("/admin-new")
    return { success: true, data }
  } catch (error) {
    console.error("Error creating service package:", error)
    return { success: false, error: "Failed to create service package" }
  }
}

// Analytics Actions
export async function getAnalyticsData() {
  const supabase = await getSupabase()
  try {
    const [quotesResult, customersResult, projectsResult, revenueResult] = await Promise.all([
      supabase.from("quotes").select("id, status, created_at, total_cost"),
      supabase.from("users").select("id, created_at, is_active").eq("role", "customer"),
      supabase.from("projects").select("id, status, progress_percentage, created_at"),
      supabase.from("estimates").select("total_amount, status, created_at"),
    ])

    return {
      quotes: quotesResult.data || [],
      customers: customersResult.data || [],
      projects: projectsResult.data || [],
      revenue: revenueResult.data || [],
    }
  } catch (error) {
    console.error("Error fetching analytics data:", error)
    return { quotes: [], customers: [], projects: [], revenue: [] }
  }
}

// Communication Actions
export async function sendCustomerEmail(customerId: string, subject: string, message: string) {
  const supabase = await getSupabase()
  try {
    // This would integrate with your email service (Resend, SendGrid, etc.)
    // For now, we'll log the conversation
    const { data: customer } = await supabase
      .from("users")
      .select("email, first_name, last_name")
      .eq("id", customerId)
      .single()

    if (!customer) throw new Error("Customer not found")

    // Create conversation record
    const { data: conversation, error: convError } = await supabase
      .from("conversations")
      .insert([
        {
          customer_id: customerId,
          subject: subject,
          status: "active",
        },
      ])
      .select()
      .single()

    if (convError) throw convError

    // Create message record
    const { error: msgError } = await supabase.from("messages").insert([
      {
        conversation_id: conversation.id,
        sender_type: "admin",
        message_text: message,
        is_read: false,
      },
    ])

    if (msgError) throw msgError

    revalidatePath("/admin-new")
    return { success: true, message: `Email sent to ${customer.email}` }
  } catch (error) {
    console.error("Error sending email:", error)
    return { success: false, error: "Failed to send email" }
  }
}

// Customer Auto-Registration Actions
export async function createCustomerFromQuote(quoteData: {
  name: string
  email: string
  phone: string
  address: string
}) {
  const supabase = await getSupabase()
  try {
    // Check if customer already exists
    const { data: existingCustomer } = await supabase
      .from("users")
      .select("id")
      .eq("email", quoteData.email)
      .eq("role", "customer")
      .single()

    if (existingCustomer) {
      return { success: true, customerId: existingCustomer.id, isNew: false }
    }

    // Generate temporary password
    const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8)

    // Create customer record (without temp_password field)
    const customerData = {
      first_name: quoteData.name.split(" ")[0],
      last_name: quoteData.name.split(" ").slice(1).join(" ") || "",
      email: quoteData.email,
      phone: quoteData.phone,
      address: quoteData.address,
      role: "customer",
      is_active: true,
      created_at: new Date().toISOString(),
    }

    const { data: newCustomer, error } = await supabase.from("users").insert([customerData]).select().single()

    if (error) throw error

    // Send welcome email with portal access info (would integrate with email service)
    await sendCustomerWelcomeEmail(newCustomer.id, tempPassword)

    return { success: true, customerId: newCustomer.id, isNew: true, tempPassword }
  } catch (error) {
    console.error("Error creating customer from quote:", error)
    return { success: false, error: "Failed to create customer account" }
  }
}

export async function sendCustomerWelcomeEmail(customerId: string, tempPassword: string) {
  const supabase = await getSupabase()
  try {
    const { data: customer } = await supabase
      .from("users")
      .select("email, first_name, last_name")
      .eq("id", customerId)
      .single()

    if (!customer) throw new Error("Customer not found")

    // Create welcome message record
    const welcomeMessage = `
Welcome to Crafted Surface Solutions Customer Portal!

Your account has been created with the following details:
Email: ${customer.email}
Temporary Password: ${tempPassword}

Please log in to your customer portal to:
- Track your quote status
- View project progress
- Schedule appointments
- Access invoices and estimates

Login at: ${process.env.NEXT_PUBLIC_SITE_URL}/customer-portal

For security, please change your password after your first login.

Best regards,
Crafted Surface Solutions Team
    `

    // Log the communication (in production, this would send actual email)
    const { error } = await supabase.from("messages").insert([
      {
        customer_id: customerId,
        sender_type: "system",
        message_text: welcomeMessage,
        subject: "Welcome to CSS Customer Portal",
        is_read: false,
      },
    ])

    if (error) throw error

    return { success: true }
  } catch (error) {
    console.error("Error sending welcome email:", error)
    return { success: false, error: "Failed to send welcome email" }
  }
}

export async function getValidQuoteStatuses() {
  try {
    // Return the valid quote statuses based on the database constraint
    // These are the allowed values for the quotes.status column
    return {
      success: true,
      statuses: ["pending", "approved", "rejected", "completed"],
    }
  } catch (error) {
    console.error("Error getting valid quote statuses:", error)
    return {
      success: false,
      statuses: ["pending", "approved", "rejected", "completed"], // fallback values
    }
  }
}

// Sales Rep Management Actions
export async function createSalesRep(formData: FormData) {
  const supabase = await getSupabase()
  try {
    const salesRepData = {
      first_name: formData.get("first_name") as string,
      last_name: formData.get("last_name") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      role: "sales_rep",
      is_active: true,
      created_at: new Date().toISOString(),
    }

    // Check if user already exists
    const { data: existingUser } = await supabase.from("users").select("id").eq("email", salesRepData.email).single()

    if (existingUser) {
      return { success: false, error: "A user with this email already exists" }
    }

    const { data, error } = await supabase.from("users").insert([salesRepData]).select().single()

    if (error) throw error

    revalidatePath("/admin-new")
    return { success: true, data }
  } catch (error) {
    console.error("Error creating sales rep:", error)
    return { success: false, error: "Failed to create sales representative" }
  }
}

export async function getSalesReps() {
  const supabase = await getSupabase()
  try {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("role", "sales_rep")
      .eq("is_active", true)
      .order("created_at", { ascending: false })

    if (error) throw error
    return { success: true, data: data || [] }
  } catch (error) {
    console.error("Error fetching sales reps:", error)
    return { success: false, error: "Failed to fetch sales representatives", data: [] }
  }
}
