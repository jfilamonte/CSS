import { createClient } from "@/lib/supabase/server"
import type { AssignmentCriteria, SalesRepWorkload } from "./types"

export class SalesRepAssignmentService {
  /**
   * Main auto-assignment function that finds the best available sales rep
   */
  static async assignSalesRep(criteria: AssignmentCriteria): Promise<{
    success: boolean
    assignedRepId?: string
    assignedRepName?: string
    reason?: string
    error?: string
  }> {
    try {
      const supabase = createClient()

      // 1. Get all available sales reps for the date/time
      const availableReps = await this.getAvailableSalesReps(criteria.date, criteria.time, criteria.duration)

      if (availableReps.length === 0) {
        return {
          success: false,
          error: "No sales representatives are available at the requested time",
        }
      }

      // 2. If a preferred rep is specified and available, use them
      if (criteria.preferredRepId) {
        const preferredRep = availableReps.find((rep) => rep.repId === criteria.preferredRepId)
        if (preferredRep) {
          return {
            success: true,
            assignedRepId: preferredRep.repId,
            assignedRepName: `${preferredRep.firstName} ${preferredRep.lastName}`,
            reason: "Preferred sales representative assigned",
          }
        }
      }

      // 3. Get workload data for all available reps
      const repsWithWorkload = await this.getWorkloadData(availableReps.map((rep) => rep.repId))

      // 4. Apply assignment algorithm
      const bestRep = await this.selectBestRep(repsWithWorkload, criteria)

      if (!bestRep) {
        return {
          success: false,
          error: "Unable to determine best sales representative",
        }
      }

      return {
        success: true,
        assignedRepId: bestRep.repId,
        assignedRepName: `${bestRep.firstName} ${bestRep.lastName}`,
        reason: "Auto-assigned based on availability and workload balance",
      }
    } catch (error) {
      console.error("Error in sales rep assignment:", error)
      return {
        success: false,
        error: "Failed to assign sales representative",
      }
    }
  }

  /**
   * Get all sales reps available for a specific date and time
   */
  private static async getAvailableSalesReps(
    date: string,
    time: string,
    duration = 60,
  ): Promise<Array<{ repId: string; firstName: string; lastName: string; email: string }>> {
    try {
      const supabase = createClient()
      const dayOfWeek = new Date(date).getDay()

      // Get sales reps with availability for this day/time
      const { data: availabilityData, error: availError } = await supabase
        .from("sales_rep_availability")
        .select(`
          sales_rep_id,
          start_time,
          end_time,
          users!sales_rep_availability_sales_rep_id_fkey(
            id, first_name, last_name, email, is_active
          )
        `)
        .eq("day_of_week", dayOfWeek)
        .eq("is_active", true)
        .lte("start_time", time)
        .gte("end_time", time)

      if (availError) throw availError

      const potentialReps = availabilityData?.filter((item) => item.users?.is_active) || []

      // Filter out reps who are blocked on this date/time
      const { data: blockedTimes, error: blockedError } = await supabase
        .from("sales_rep_blocked_times")
        .select("sales_rep_id, start_time, end_time, is_all_day")
        .eq("blocked_date", date)

      if (blockedError) throw blockedError

      const blockedRepIds = new Set<string>()
      blockedTimes?.forEach((blocked) => {
        if (blocked.is_all_day) {
          blockedRepIds.add(blocked.sales_rep_id)
        } else if (blocked.start_time <= time && blocked.end_time > time) {
          blockedRepIds.add(blocked.sales_rep_id)
        }
      })

      // Filter out reps with conflicting appointments
      const endTime = this.addMinutesToTime(time, duration)
      const { data: existingAppointments, error: aptError } = await supabase
        .from("appointments")
        .select("assigned_to, scheduled_time, duration_minutes")
        .eq("scheduled_date", date)
        .not("status", "in", '("cancelled","no-show")')

      if (aptError) throw aptError

      const conflictingRepIds = new Set<string>()
      existingAppointments?.forEach((apt) => {
        if (apt.assigned_to) {
          const aptStart = apt.scheduled_time
          const aptEnd = this.addMinutesToTime(apt.scheduled_time, apt.duration_minutes)

          // Check for time overlap
          if (
            (time >= aptStart && time < aptEnd) ||
            (endTime > aptStart && endTime <= aptEnd) ||
            (time <= aptStart && endTime >= aptEnd)
          ) {
            conflictingRepIds.add(apt.assigned_to)
          }
        }
      })

      // Return available reps
      return potentialReps
        .filter(
          (item) => !blockedRepIds.has(item.sales_rep_id) && !conflictingRepIds.has(item.sales_rep_id) && item.users,
        )
        .map((item) => ({
          repId: item.sales_rep_id,
          firstName: item.users!.first_name,
          lastName: item.users!.last_name,
          email: item.users!.email,
        }))
    } catch (error) {
      console.error("Error getting available sales reps:", error)
      return []
    }
  }

  /**
   * Get workload data for sales reps to enable load balancing
   */
  private static async getWorkloadData(repIds: string[]): Promise<SalesRepWorkload[]> {
    try {
      const supabase = createClient()
      const startOfWeek = this.getStartOfWeek(new Date())
      const endOfWeek = this.getEndOfWeek(new Date())
      const today = new Date().toISOString().split("T")[0]

      const workloadData: SalesRepWorkload[] = []

      for (const repId of repIds) {
        // Get rep basic info
        const { data: repData, error: repError } = await supabase
          .from("users")
          .select("id, first_name, last_name, email")
          .eq("id", repId)
          .single()

        if (repError || !repData) continue

        // Get appointments this week
        const { data: weeklyAppointments, error: weeklyError } = await supabase
          .from("appointments")
          .select("duration_minutes")
          .eq("assigned_to", repId)
          .gte("scheduled_date", startOfWeek)
          .lte("scheduled_date", endOfWeek)
          .not("status", "in", '("cancelled","no-show")')

        if (weeklyError) {
          console.error("Error fetching weekly appointments:", weeklyError)
          continue
        }

        // Get appointments today
        const { data: todayAppointments, error: todayError } = await supabase
          .from("appointments")
          .select("id")
          .eq("assigned_to", repId)
          .eq("scheduled_date", today)
          .not("status", "in", '("cancelled","no-show")')

        if (todayError) {
          console.error("Error fetching today's appointments:", todayError)
          continue
        }

        const totalHoursThisWeek =
          (weeklyAppointments || []).reduce((sum, apt) => sum + (apt.duration_minutes || 60), 0) / 60

        workloadData.push({
          repId: repData.id,
          firstName: repData.first_name,
          lastName: repData.last_name,
          email: repData.email,
          appointmentsThisWeek: (weeklyAppointments || []).length,
          appointmentsToday: (todayAppointments || []).length,
          totalHoursThisWeek,
        })
      }

      return workloadData
    } catch (error) {
      console.error("Error getting workload data:", error)
      return []
    }
  }

  /**
   * Select the best sales rep based on multiple criteria
   */
  private static async selectBestRep(
    repsWithWorkload: SalesRepWorkload[],
    criteria: AssignmentCriteria,
  ): Promise<SalesRepWorkload | null> {
    if (repsWithWorkload.length === 0) return null
    if (repsWithWorkload.length === 1) return repsWithWorkload[0]

    // Calculate scores for each rep
    const scoredReps = repsWithWorkload.map((rep) => {
      let score = 100 // Base score

      // Factor 1: Workload balance (lower workload = higher score)
      const avgWeeklyAppointments =
        repsWithWorkload.reduce((sum, r) => sum + r.appointmentsThisWeek, 0) / repsWithWorkload.length
      const workloadDiff = rep.appointmentsThisWeek - avgWeeklyAppointments
      score -= workloadDiff * 10 // Penalize higher workload

      // Factor 2: Daily distribution (prefer reps with fewer appointments today)
      const avgDailyAppointments =
        repsWithWorkload.reduce((sum, r) => sum + r.appointmentsToday, 0) / repsWithWorkload.length
      const dailyDiff = rep.appointmentsToday - avgDailyAppointments
      score -= dailyDiff * 15 // Higher penalty for daily imbalance

      // Factor 3: Total hours balance
      const avgWeeklyHours =
        repsWithWorkload.reduce((sum, r) => sum + r.totalHoursThisWeek, 0) / repsWithWorkload.length
      const hoursDiff = rep.totalHoursThisWeek - avgWeeklyHours
      score -= hoursDiff * 2 // Small penalty for hour imbalance

      // Factor 4: Random factor to prevent always picking the same rep
      score += Math.random() * 5

      return { ...rep, score }
    })

    // Sort by score (highest first) and return the best rep
    scoredReps.sort((a, b) => b.score - a.score)
    return scoredReps[0]
  }

  /**
   * Get available sales reps with their current workload for manual assignment
   */
  static async getAvailableRepsWithWorkload(
    date: string,
    time: string,
  ): Promise<{
    success: boolean
    reps?: Array<SalesRepWorkload & { available: boolean }>
    error?: string
  }> {
    try {
      const availableReps = await this.getAvailableSalesReps(date, time)
      const allActiveReps = await this.getAllActiveSalesReps()
      const workloadData = await this.getWorkloadData(allActiveReps.map((rep) => rep.repId))

      const repsWithAvailability = workloadData.map((rep) => ({
        ...rep,
        available: availableReps.some((availRep) => availRep.repId === rep.repId),
      }))

      return {
        success: true,
        reps: repsWithAvailability,
      }
    } catch (error) {
      console.error("Error getting reps with workload:", error)
      return {
        success: false,
        error: "Failed to get sales rep availability",
      }
    }
  }

  /**
   * Get all active sales representatives
   */
  private static async getAllActiveSalesReps(): Promise<
    Array<{ repId: string; firstName: string; lastName: string; email: string }>
  > {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("users")
        .select("id, first_name, last_name, email")
        .eq("role", "sales_rep") // Updated role to match fixed constraint
        .eq("is_active", true)

      if (error) throw error

      return (data || []).map((rep) => ({
        repId: rep.id,
        firstName: rep.first_name,
        lastName: rep.last_name,
        email: rep.email,
      }))
    } catch (error) {
      console.error("Error getting all active sales reps:", error)
      return []
    }
  }

  /**
   * Utility function to add minutes to a time string
   */
  private static addMinutesToTime(timeString: string, minutes: number): string {
    const [hours, mins] = timeString.split(":").map(Number)
    const date = new Date()
    date.setHours(hours, mins + minutes, 0, 0)
    return date.toTimeString().slice(0, 5)
  }

  /**
   * Get start of current week (Sunday)
   */
  private static getStartOfWeek(date: Date): string {
    const start = new Date(date)
    start.setDate(date.getDate() - date.getDay())
    return start.toISOString().split("T")[0]
  }

  /**
   * Get end of current week (Saturday)
   */
  private static getEndOfWeek(date: Date): string {
    const end = new Date(date)
    end.setDate(date.getDate() + (6 - date.getDay()))
    return end.toISOString().split("T")[0]
  }

  /**
   * Reassign appointments when a sales rep becomes unavailable
   */
  static async reassignAppointments(
    unavailableRepId: string,
    dateRange?: { start: string; end: string },
  ): Promise<{
    success: boolean
    reassignedCount?: number
    failedAppointments?: string[]
    error?: string
  }> {
    try {
      const supabase = createClient()
      let query = supabase
        .from("appointments")
        .select("id, scheduled_date, scheduled_time, duration_minutes, appointment_type, customer_id")
        .eq("assigned_to", unavailableRepId)
        .in("status", ["scheduled", "confirmed"])

      if (dateRange) {
        query = query.gte("scheduled_date", dateRange.start).lte("scheduled_date", dateRange.end)
      }

      const { data: appointmentsToReassign, error: fetchError } = await query

      if (fetchError) throw fetchError

      if (!appointmentsToReassign || appointmentsToReassign.length === 0) {
        return { success: true, reassignedCount: 0 }
      }

      let reassignedCount = 0
      const failedAppointments: string[] = []

      for (const appointment of appointmentsToReassign) {
        const assignmentResult = await this.assignSalesRep({
          date: appointment.scheduled_date,
          time: appointment.scheduled_time,
          duration: appointment.duration_minutes,
          appointmentType: appointment.appointment_type,
          customerId: appointment.customer_id,
        })

        if (assignmentResult.success && assignmentResult.assignedRepId) {
          // Update the appointment with new assignment
          const { error: updateError } = await supabase
            .from("appointments")
            .update({
              assigned_to: assignmentResult.assignedRepId,
              admin_notes: `Reassigned from unavailable rep to ${assignmentResult.assignedRepName}`,
            })
            .eq("id", appointment.id)

          if (updateError) {
            console.error("Error updating appointment:", updateError)
            failedAppointments.push(appointment.id)
          } else {
            reassignedCount++
          }
        } else {
          failedAppointments.push(appointment.id)
        }
      }

      return {
        success: true,
        reassignedCount,
        failedAppointments: failedAppointments.length > 0 ? failedAppointments : undefined,
      }
    } catch (error) {
      console.error("Error reassigning appointments:", error)
      return {
        success: false,
        error: "Failed to reassign appointments",
      }
    }
  }
}
