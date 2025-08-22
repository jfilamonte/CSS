"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts"
import {
  TrendingUp,
  DollarSign,
  Users,
  FileText,
  Calendar,
  Target,
  Clock,
  Phone,
  Download,
  RefreshCw,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface AnalyticsData {
  overview: {
    totalRevenue: number
    revenueChange: number
    totalQuotes: number
    quotesChange: number
    totalCustomers: number
    customersChange: number
    conversionRate: number
    conversionChange: number
  }
  revenueData: Array<{
    month: string
    revenue: number
    quotes: number
    customers: number
  }>
  quotesByStatus: Array<{
    status: string
    count: number
    value: number
  }>
  projectsByType: Array<{
    type: string
    count: number
    revenue: number
  }>
  customerAcquisition: Array<{
    source: string
    customers: number
    conversion: number
  }>
  recentActivity: Array<{
    id: string
    type: string
    description: string
    timestamp: string
    value?: number
  }>
}

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"]

export default function AnalyticsDashboard() {
  const [timeRange, setTimeRange] = useState("30d")
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  const supabase = createClient()

  useEffect(() => {
    fetchAnalyticsData()
  }, [timeRange])

  const fetchAnalyticsData = async () => {
    setLoading(true)
    try {
      // Calculate date range
      const endDate = new Date()
      const startDate = new Date()
      const days = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : timeRange === "90d" ? 90 : 365
      startDate.setDate(endDate.getDate() - days)

      // Fetch data from multiple tables
      const [quotesResult, customersResult, projectsResult, appointmentsResult] = await Promise.all([
        supabase
          .from("quotes")
          .select("*")
          .gte("created_at", startDate.toISOString())
          .order("created_at", { ascending: false }),
        supabase
          .from("users")
          .select("*")
          .eq("role", "customer")
          .gte("created_at", startDate.toISOString())
          .order("created_at", { ascending: false }),
        supabase
          .from("projects")
          .select("*")
          .gte("created_at", startDate.toISOString())
          .order("created_at", { ascending: false }),
        supabase
          .from("appointments")
          .select("*")
          .gte("created_at", startDate.toISOString())
          .order("created_at", { ascending: false }),
      ])

      const quotes = quotesResult.data || []
      const customers = customersResult.data || []
      const projects = projectsResult.data || []
      const appointments = appointmentsResult.data || []

      // Calculate overview metrics
      const totalRevenue = quotes.reduce((sum, quote) => sum + (quote.total_cost || 0), 0)
      const totalQuotes = quotes.length
      const totalCustomers = customers.length
      const convertedQuotes = quotes.filter((q) => q.status === "converted").length
      const conversionRate = totalQuotes > 0 ? (convertedQuotes / totalQuotes) * 100 : 0

      // Generate monthly data
      const monthlyData = generateMonthlyData(quotes, customers, days)

      // Group quotes by status
      const quotesByStatus = [
        {
          status: "Pending",
          count: quotes.filter((q) => q.status === "pending").length,
          value: quotes.filter((q) => q.status === "pending").reduce((sum, q) => sum + (q.total_cost || 0), 0),
        },
        {
          status: "Quoted",
          count: quotes.filter((q) => q.status === "quoted").length,
          value: quotes.filter((q) => q.status === "quoted").reduce((sum, q) => sum + (q.total_cost || 0), 0),
        },
        {
          status: "Converted",
          count: quotes.filter((q) => q.status === "converted").length,
          value: quotes.filter((q) => q.status === "converted").reduce((sum, q) => sum + (q.total_cost || 0), 0),
        },
      ]

      // Group projects by type
      const projectsByType = [
        {
          type: "Residential",
          count: projects.filter((p) => p.title?.toLowerCase().includes("residential")).length,
          revenue: projects
            .filter((p) => p.title?.toLowerCase().includes("residential"))
            .reduce((sum, p) => sum + (p.square_footage || 0) * 6, 0),
        },
        {
          type: "Commercial",
          count: projects.filter((p) => p.title?.toLowerCase().includes("commercial")).length,
          revenue: projects
            .filter((p) => p.title?.toLowerCase().includes("commercial"))
            .reduce((sum, p) => sum + (p.square_footage || 0) * 7, 0),
        },
        {
          type: "Industrial",
          count: projects.filter((p) => p.title?.toLowerCase().includes("industrial")).length,
          revenue: projects
            .filter((p) => p.title?.toLowerCase().includes("industrial"))
            .reduce((sum, p) => sum + (p.square_footage || 0) * 8, 0),
        },
      ]

      // Customer acquisition sources (simulated)
      const customerAcquisition = [
        { source: "Website", customers: Math.floor(customers.length * 0.4), conversion: 12.5 },
        { source: "Referrals", customers: Math.floor(customers.length * 0.3), conversion: 25.0 },
        { source: "Google Ads", customers: Math.floor(customers.length * 0.2), conversion: 8.3 },
        { source: "Social Media", customers: Math.floor(customers.length * 0.1), conversion: 6.7 },
      ]

      // Recent activity
      const recentActivity = [
        ...quotes.slice(0, 3).map((quote) => ({
          id: quote.id,
          type: "quote",
          description: `New quote request from ${quote.customer_name}`,
          timestamp: quote.created_at,
          value: quote.total_cost,
        })),
        ...appointments.slice(0, 2).map((apt) => ({
          id: apt.id,
          type: "appointment",
          description: `${apt.appointment_type} scheduled`,
          timestamp: apt.created_at,
        })),
      ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

      setAnalyticsData({
        overview: {
          totalRevenue,
          revenueChange: 15.2, // Simulated
          totalQuotes,
          quotesChange: 8.1, // Simulated
          totalCustomers,
          customersChange: 12.3, // Simulated
          conversionRate,
          conversionChange: 2.1, // Simulated
        },
        revenueData: monthlyData,
        quotesByStatus,
        projectsByType,
        customerAcquisition,
        recentActivity,
      })

      setLastUpdated(new Date())
    } catch (error) {
      console.error("Error fetching analytics data:", error)
    } finally {
      setLoading(false)
    }
  }

  const generateMonthlyData = (quotes: any[], customers: any[], days: number) => {
    const data = []
    const months = days <= 30 ? 1 : days <= 90 ? 3 : 12
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

    for (let i = months - 1; i >= 0; i--) {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1)
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0)

      const monthQuotes = quotes.filter((q) => {
        const quoteDate = new Date(q.created_at)
        return quoteDate >= monthStart && quoteDate <= monthEnd
      })

      const monthCustomers = customers.filter((c) => {
        const customerDate = new Date(c.created_at)
        return customerDate >= monthStart && customerDate <= monthEnd
      })

      data.push({
        month: monthNames[date.getMonth()],
        revenue: monthQuotes.reduce((sum, q) => sum + (q.total_cost || 0), 0),
        quotes: monthQuotes.length,
        customers: monthCustomers.length,
      })
    }

    return data
  }

  const exportData = () => {
    if (!analyticsData) return

    const exportData = {
      generatedAt: new Date().toISOString(),
      timeRange,
      ...analyticsData,
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `analytics-${timeRange}-${new Date().toISOString().split("T")[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!analyticsData) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No analytics data available</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h2>
          <p className="text-gray-600">
            Last updated: {lastUpdated.toLocaleString()} • {timeRange} view
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={fetchAnalyticsData} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={exportData} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${analyticsData.overview.totalRevenue.toLocaleString()}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="w-3 h-3 mr-1 text-green-500" />+{analyticsData.overview.revenueChange}% from last
              period
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Quotes</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.overview.totalQuotes}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="w-3 h-3 mr-1 text-green-500" />+{analyticsData.overview.quotesChange}% from last
              period
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.overview.totalCustomers}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="w-3 h-3 mr-1 text-green-500" />+{analyticsData.overview.customersChange}% from last
              period
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.overview.conversionRate.toFixed(1)}%</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="w-3 h-3 mr-1 text-green-500" />+{analyticsData.overview.conversionChange}% from
              last period
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="revenue" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="revenue">Revenue Trends</TabsTrigger>
          <TabsTrigger value="quotes">Quote Analysis</TabsTrigger>
          <TabsTrigger value="customers">Customer Insights</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        {/* Revenue Trends Tab */}
        <TabsContent value="revenue" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Over Time</CardTitle>
                <CardDescription>Monthly revenue and growth trends</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={analyticsData.revenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`$${Number(value).toLocaleString()}`, "Revenue"]} />
                    <Area type="monotone" dataKey="revenue" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Projects by Type</CardTitle>
                <CardDescription>Revenue distribution by project category</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analyticsData.projectsByType}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="revenue"
                      label={({ type, revenue }) => `${type}: $${revenue.toLocaleString()}`}
                    >
                      {analyticsData.projectsByType.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`$${Number(value).toLocaleString()}`, "Revenue"]} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Monthly Performance</CardTitle>
              <CardDescription>Quotes, customers, and revenue by month</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={analyticsData.revenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="quotes" fill="#3b82f6" name="Quotes" />
                  <Bar dataKey="customers" fill="#10b981" name="Customers" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Quote Analysis Tab */}
        <TabsContent value="quotes" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Quotes by Status</CardTitle>
                <CardDescription>Current quote pipeline status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.quotesByStatus.map((status, index) => (
                    <div key={status.status} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full`} style={{ backgroundColor: COLORS[index] }}></div>
                        <span className="font-medium">{status.status}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{status.count} quotes</div>
                        <div className="text-sm text-gray-500">${status.value.toLocaleString()}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Conversion Funnel</CardTitle>
                <CardDescription>Quote to customer conversion process</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Total Quotes</span>
                    <div className="flex items-center space-x-2">
                      <Progress value={100} className="w-24" />
                      <span className="font-bold">{analyticsData.overview.totalQuotes}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Quoted</span>
                    <div className="flex items-center space-x-2">
                      <Progress
                        value={
                          ((analyticsData.quotesByStatus.find((s) => s.status === "Quoted")?.count || 0) /
                            analyticsData.overview.totalQuotes) *
                          100
                        }
                        className="w-24"
                      />
                      <span className="font-bold">
                        {analyticsData.quotesByStatus.find((s) => s.status === "Quoted")?.count || 0}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Converted</span>
                    <div className="flex items-center space-x-2">
                      <Progress
                        value={
                          ((analyticsData.quotesByStatus.find((s) => s.status === "Converted")?.count || 0) /
                            analyticsData.overview.totalQuotes) *
                          100
                        }
                        className="w-24"
                      />
                      <span className="font-bold">
                        {analyticsData.quotesByStatus.find((s) => s.status === "Converted")?.count || 0}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Quote Value Distribution</CardTitle>
              <CardDescription>Analysis of quote values and patterns</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analyticsData.quotesByStatus}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="status" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`$${Number(value).toLocaleString()}`, "Total Value"]} />
                  <Bar dataKey="value" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Customer Insights Tab */}
        <TabsContent value="customers" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Customer Acquisition</CardTitle>
                <CardDescription>How customers find your business</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.customerAcquisition.map((source, index) => (
                    <div key={source.source} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full`} style={{ backgroundColor: COLORS[index] }}></div>
                        <span className="font-medium">{source.source}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{source.customers} customers</div>
                        <div className="text-sm text-gray-500">{source.conversion}% conversion</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Customer Growth</CardTitle>
                <CardDescription>New customers over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analyticsData.revenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="customers" stroke="#10b981" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest customer interactions and business activities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData.recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center space-x-4 p-3 border rounded-lg">
                    <div className="flex-shrink-0">
                      {activity.type === "quote" ? (
                        <FileText className="w-5 h-5 text-blue-500" />
                      ) : activity.type === "appointment" ? (
                        <Calendar className="w-5 h-5 text-green-500" />
                      ) : (
                        <Users className="w-5 h-5 text-purple-500" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{activity.description}</p>
                      <p className="text-sm text-gray-500">{new Date(activity.timestamp).toLocaleString()}</p>
                    </div>
                    {activity.value && (
                      <div className="text-right">
                        <Badge variant="outline">${activity.value.toLocaleString()}</Badge>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="w-4 h-4 mr-2" />
                  Response Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">2.3 hours</div>
                <p className="text-sm text-gray-500">Average response to quotes</p>
                <Progress value={85} className="mt-2" />
                <p className="text-xs text-green-600 mt-1">15% faster than target</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="w-4 h-4 mr-2" />
                  Goal Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">78%</div>
                <p className="text-sm text-gray-500">Monthly revenue goal</p>
                <Progress value={78} className="mt-2" />
                <p className="text-xs text-blue-600 mt-1">$22k remaining</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Phone className="w-4 h-4 mr-2" />
                  Contact Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">92%</div>
                <p className="text-sm text-gray-500">Successful customer contact</p>
                <Progress value={92} className="mt-2" />
                <p className="text-xs text-green-600 mt-1">Above industry average</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Key Performance Indicators</CardTitle>
                <CardDescription>Track important business metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Average Quote Value</span>
                    <span className="font-bold">
                      $
                      {analyticsData.overview.totalQuotes > 0
                        ? Math.round(analyticsData.overview.totalRevenue / analyticsData.overview.totalQuotes)
                        : 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Customer Lifetime Value</span>
                    <span className="font-bold">$8,500</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Cost Per Acquisition</span>
                    <span className="font-bold">$125</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Project Completion Rate</span>
                    <span className="font-bold">96%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Customer Satisfaction</span>
                    <span className="font-bold">4.8/5</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Business Health Score</CardTitle>
                <CardDescription>Overall business performance indicator</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center space-y-4">
                  <div className="text-4xl font-bold text-green-600">87</div>
                  <Progress value={87} className="w-full" />
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="font-medium">Revenue Growth</div>
                      <div className="text-green-600">Excellent</div>
                    </div>
                    <div>
                      <div className="font-medium">Customer Retention</div>
                      <div className="text-green-600">Strong</div>
                    </div>
                    <div>
                      <div className="font-medium">Operational Efficiency</div>
                      <div className="text-yellow-600">Good</div>
                    </div>
                    <div>
                      <div className="font-medium">Market Position</div>
                      <div className="text-green-600">Leading</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
