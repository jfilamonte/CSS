export type Role = "admin" | "user" | "sales_rep"
export type LeadStatus = "new" | "contacted" | "qualified" | "converted" | "lost"
export type QuoteStatus = "draft" | "sent" | "accepted" | "rejected" | "expired"
export type ProjectStatus = "planning" | "in_progress" | "completed" | "on_hold" | "cancelled"
export type TaskStatus = "todo" | "in_progress" | "completed" | "cancelled"
export type Priority = "low" | "medium" | "high" | "urgent"
export type PaymentStatus = "pending" | "paid" | "overdue" | "cancelled"
export type PaymentMethod = "cash" | "check" | "credit_card" | "bank_transfer"
export type FileCategory = "document" | "image" | "video" | "other"
export type ActivityType = "call" | "email" | "meeting" | "note" | "task"

// Base types matching Supabase schema
export interface User {
  id: string
  email: string
  first_name?: string
  last_name?: string
  phone?: string
  role: Role
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Lead {
  id: string
  customer_name: string
  customer_email: string
  customer_phone?: string
  project_type: string
  square_footage?: number
  project_address?: string
  message?: string
  status: LeadStatus
  created_at: string
  updated_at: string
}

export interface Quote {
  id: string
  customer_name: string
  customer_email: string
  customer_phone?: string
  project_type: string
  square_footage?: number
  project_address?: string
  message?: string
  status: QuoteStatus
  created_at: string
  updated_at: string
}

export interface Project {
  id: string
  title: string
  customer_id?: string
  square_footage?: number
  project_address?: string
  budget?: number
  status: ProjectStatus
  progress_percentage?: number
  created_at: string
  updated_at: string
}

// Extended types with relations
export interface UserWithRelations extends User {
  sessions?: any[]
  leadsSubmitted?: Lead[]
  quotesCreated?: Quote[]
  projectsManaged?: Project[]
  customerProjects?: Project[]
}

export interface LeadWithRelations extends Lead {
  submittedBy?: User | null
  assignedTo?: User | null
  quotes?: Quote[]
  activities?: LeadActivity[] // LeadActivity is assumed to be declared elsewhere
}

export interface QuoteWithRelations extends Quote {
  lead: Lead
  createdBy: User
  assignedTo?: User | null
  quoteItems?: any[]
  project?: Project | null
}

export interface ProjectWithRelations extends Project {
  customer: User
  manager?: User | null
  quote: Quote & { lead: Lead; quoteItems?: any[] }
  tasks?: ProjectTask[] // ProjectTask is assumed to be declared elsewhere
  files?: ProjectFile[] // ProjectFile is assumed to be declared elsewhere
  payments?: Payment[] // Payment is assumed to be declared elsewhere
}

// Dashboard data types
export interface DashboardStats {
  totalLeads: number
  activeQuotes: number
  ongoingProjects: number
  totalRevenue: number
  newLeadsThisWeek: number
  quotesThisWeek: number
  projectsCompletedThisMonth: number
  conversionRate: number
}

export interface LeadPipelineData {
  status: LeadStatus
  count: number
  value?: number
}

export interface RevenueData {
  month: string
  revenue: number
  projects: number
}

// Form types
export interface LeadFormData {
  fullName: string
  email: string
  phone?: string
  projectType: string
  squareFootage?: string
  timeline?: string
  address?: string
  city?: string
  state?: string
  zipCode?: string
  details?: string
  wantsAppointment?: boolean
}

export interface QuoteFormData {
  leadId: string
  title: string
  description?: string
  squareFootage?: number
  laborCost: number
  materialCost: number
  validUntil: Date
  assignedToId?: string
  items: QuoteItemData[]
}

export interface QuoteItemData {
  name: string
  description?: string
  quantity: number
  unitPrice: number
}

export interface ProjectFormData {
  quoteId: string
  title: string
  description?: string
  customerId: string
  managerId?: string
  address: string
  city: string
  state: string
  zipCode: string
  squareFootage?: number
  startDate?: Date
  endDate?: Date
}

// API response types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Filter types
export interface LeadFilters {
  status?: LeadStatus
  assignedToId?: string
  dateFrom?: Date
  dateTo?: Date
  search?: string
}

export interface QuoteFilters {
  status?: QuoteStatus
  assignedToId?: string
  dateFrom?: Date
  dateTo?: Date
  search?: string
}

export interface ProjectFilters {
  status?: ProjectStatus
  customerId?: string
  managerId?: string
  dateFrom?: Date
  dateTo?: Date
  search?: string
}

// CMS types
export interface ServiceFormData {
  title: string
  description: string
  content: string
  metaTitle?: string
  metaDescription?: string
  keywords?: string
  featured?: boolean
  isActive?: boolean
  heroImage?: string
  gallery?: string[]
}

export interface BlogPostFormData {
  title: string
  excerpt?: string
  content: string
  metaTitle?: string
  metaDescription?: string
  keywords?: string
  isPublished?: boolean
  featuredImage?: string
}

export interface PortfolioItemFormData {
  title: string
  description?: string
  category: string
  location?: string
  squareFootage?: number
  completedAt?: Date
  images?: string[]
  beforeImages?: string[]
  afterImages?: string[]
  featured?: boolean
  isActive?: boolean
}

// Notification types
export interface NotificationData {
  id: string
  type: "lead" | "quote" | "project" | "payment" | "system"
  title: string
  message: string
  read: boolean
  createdAt: Date
  actionUrl?: string
}

// File upload types
export interface FileUploadData {
  fileName: string
  fileUrl: string
  fileType: string
  fileSize: number
  category: FileCategory
}

// Calendar/scheduling types
export interface CalendarEvent {
  id: string
  title: string
  start: Date
  end: Date
  type: "appointment" | "project" | "follow-up"
  relatedId?: string
  description?: string
}

// Legacy types for backward compatibility
export interface AssignmentCriteria {
  date: string
  time: string
  duration?: number
  appointmentType?: string
  customerId?: string
  preferredRepId?: string
}

export interface SalesRepWorkload {
  repId: string
  firstName: string
  lastName: string
  email: string
  appointmentsThisWeek: number
  appointmentsToday: number
  totalHoursThisWeek: number
  averageRating?: number
  specialties?: string[]
}

export interface Appointment {
  id: string
  customer_id: string
  assigned_to?: string
  scheduled_date: string
  scheduled_time: string
  duration_minutes: number
  appointment_type: string
  status: "scheduled" | "confirmed" | "completed" | "cancelled" | "no-show"
  admin_notes?: string
  created_at: string
  updated_at: string
}

export interface SalesRepAvailability {
  id: string
  sales_rep_id: string
  day_of_week: number
  start_time: string
  end_time: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface SalesRepBlockedTime {
  id: string
  sales_rep_id: string
  blocked_date: string
  start_time?: string
  end_time?: string
  is_all_day: boolean
  reason: string
  created_at: string
  updated_at: string
}

// Declare missing types
export interface LeadActivity {
  id: string
  lead_id: string
  activity_type: ActivityType
  title: string
  description?: string
  scheduled_date?: string
  completed_date?: string
  created_by: string
  created_at: string
  updated_at: string
}

export interface ProjectTask {
  id: string
  project_id: string
  title: string
  description?: string
  status: TaskStatus
  priority: Priority
  assigned_to?: string
  due_date?: string
  completed_date?: string
  created_at: string
  updated_at: string
}

export interface ProjectFile {
  id: string
  project_id: string
  file_name: string
  file_url: string
  file_type: string
  file_size: number
  category: FileCategory
  uploaded_by: string
  created_at: string
}

export interface Payment {
  id: string
  project_id?: string
  invoice_id?: string
  amount: number
  payment_method: PaymentMethod
  status: PaymentStatus
  stripe_payment_intent_id?: string
  transaction_date: string
  created_at: string
  updated_at: string
}
