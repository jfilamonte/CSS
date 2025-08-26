"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  DollarSign,
  TrendingUp,
  FileText,
  Download,
  Send,
  AlertCircle,
  CheckCircle,
  Clock,
  BarChart3,
} from "lucide-react"

interface FinancialStats {
  totalRevenue: number
  monthlyRevenue: number
  outstandingInvoices: number
  paidInvoices: number
  overdueInvoices: number
  averageProjectValue: number
  profitMargin: number
  cashFlow: number
}

interface Invoice {
  id: string
  number: string
  customer_name: string
  amount: number
  status: "pending" | "paid" | "overdue" | "cancelled"
  due_date: string
  created_at: string
  project_title?: string
}

interface PaymentPlan {
  id: string
  customer_name: string
  total_amount: number
  monthly_payment: number
  remaining_balance: number
  next_payment_date: string
  status: "active" | "completed" | "defaulted"
}

interface Contract {
  id: string
  customer_name: string
  contract_value: number
  start_date: string
  end_date: string
  status: "active" | "completed" | "terminated"
}

export default function FinancialManagementDashboard() {
  const [stats, setStats] = useState<FinancialStats>({
    totalRevenue: 0,
    monthlyRevenue: 0,
    outstandingInvoices: 0,
    paidInvoices: 0,
    overdueInvoices: 0,
    averageProjectValue: 0,
    profitMargin: 0,
    cashFlow: 0,
  })

  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [paymentPlans, setPaymentPlans] = useState<PaymentPlan[]>([])
  const [contracts, setContracts] = useState<Contract[]>([])
  const [billingSettings, setBillingSettings] = useState({
    autoInvoice: "project-completion",
    reminderSchedule: "3-days",
    lateFeePercentage: 1.5,
    taxRate: 8.0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadFinancialData()
  }, [])

  const loadFinancialData = async () => {
    try {
      setLoading(true)

      // Load financial statistics
      const statsResponse = await fetch("/api/admin/financial/stats")
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setStats(statsData)
      }

      // Load invoices
      const invoicesResponse = await fetch("/api/admin/financial/invoices")
      if (invoicesResponse.ok) {
        const invoicesData = await invoicesResponse.json()
        setInvoices(invoicesData)
      }

      // Load payment plans
      const plansResponse = await fetch("/api/admin/financial/payment-plans")
      if (plansResponse.ok) {
        const plansData = await plansResponse.json()
        setPaymentPlans(plansData)
      }

      const contractsResponse = await fetch("/api/admin/contracts")
      if (contractsResponse.ok) {
        const contractsData = await contractsResponse.json()
        setContracts(contractsData)
      }
    } catch (error) {
      console.error("Error loading financial data:", error)
    } finally {
      setLoading(false)
    }
  }

  const generateInvoice = async (projectId: string) => {
    try {
      const response = await fetch("/api/admin/financial/generate-invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      })

      if (response.ok) {
        await loadFinancialData()
        alert("Invoice generated successfully!")
      }
    } catch (error) {
      console.error("Error generating invoice:", error)
      alert("Error generating invoice")
    }
  }

  const sendPaymentReminder = async (invoiceId: string) => {
    try {
      const response = await fetch("/api/admin/financial/send-reminder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId }),
      })

      if (response.ok) {
        alert("Payment reminder sent successfully!")
      }
    } catch (error) {
      console.error("Error sending reminder:", error)
      alert("Error sending payment reminder")
    }
  }

  const exportFinancialReport = async (reportType: string, dateRange: string) => {
    try {
      const response = await fetch(`/api/admin/financial/export?type=${reportType}&range=${dateRange}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `${reportType}-report-${dateRange}.pdf`
        a.click()
      }
    } catch (error) {
      console.error("Error exporting report:", error)
      alert("Error exporting financial report")
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "paid":
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case "pending":
      case "active":
        return <Clock className="w-4 h-4 text-yellow-500" />
      case "overdue":
      case "defaulted":
        return <AlertCircle className="w-4 h-4 text-red-500" />
      default:
        return <Clock className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
      case "completed":
        return "bg-green-100 text-green-800"
      case "pending":
      case "active":
        return "bg-yellow-100 text-yellow-800"
      case "overdue":
      case "defaulted":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading financial data...</div>
  }

  return (
    <div className="space-y-6">
      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold">${stats.totalRevenue.toLocaleString()}</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
                <p className="text-2xl font-bold">${stats.monthlyRevenue.toLocaleString()}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Outstanding</p>
                <p className="text-2xl font-bold">${stats.outstandingInvoices.toLocaleString()}</p>
              </div>
              <FileText className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Profit Margin</p>
                <p className="text-2xl font-bold">{stats.profitMargin.toFixed(1)}%</p>
              </div>
              <BarChart3 className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Financial Management Tabs */}
      <Tabs defaultValue="invoices" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="payments">Payment Plans</TabsTrigger>
          <TabsTrigger value="contracts">Contracts</TabsTrigger>
          <TabsTrigger value="accounting">Accounting</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Invoices Tab */}
        <TabsContent value="invoices" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Invoice Management</CardTitle>
                  <CardDescription>Manage customer invoices and payment tracking</CardDescription>
                </div>
                <Button onClick={() => generateInvoice("")}>
                  <FileText className="w-4 h-4 mr-2" />
                  Create Invoice
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {invoices.map((invoice) => (
                  <div key={invoice.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      {getStatusIcon(invoice.status)}
                      <div>
                        <p className="font-medium">{invoice.number}</p>
                        <p className="text-sm text-gray-600">{invoice.customer_name}</p>
                        {invoice.project_title && <p className="text-xs text-gray-500">{invoice.project_title}</p>}
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="font-medium">${invoice.amount.toLocaleString()}</p>
                        <p className="text-sm text-gray-600">Due: {new Date(invoice.due_date).toLocaleDateString()}</p>
                      </div>
                      <Badge className={getStatusColor(invoice.status)}>{invoice.status}</Badge>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline">
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => sendPaymentReminder(invoice.id)}>
                          <Send className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payment Plans Tab */}
        <TabsContent value="payments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payment Plans</CardTitle>
              <CardDescription>Manage customer payment plans and financing options</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {paymentPlans.map((plan) => (
                  <div key={plan.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      {getStatusIcon(plan.status)}
                      <div>
                        <p className="font-medium">{plan.customer_name}</p>
                        <p className="text-sm text-gray-600">${plan.monthly_payment}/month</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="font-medium">${plan.remaining_balance.toLocaleString()} remaining</p>
                        <p className="text-sm text-gray-600">
                          Next: {new Date(plan.next_payment_date).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge className={getStatusColor(plan.status)}>{plan.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contracts Tab */}
        <TabsContent value="contracts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Contract Management</CardTitle>
              <CardDescription>Manage customer contracts and status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {contracts.map((contract) => (
                  <div key={contract.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      {getStatusIcon(contract.status)}
                      <div>
                        <p className="font-medium">{contract.customer_name}</p>
                        <p className="text-sm text-gray-600">${contract.contract_value.toLocaleString()}</p>
                        <p className="text-xs text-gray-500">
                          Start: {new Date(contract.start_date).toLocaleDateString()}, End:{" "}
                          {new Date(contract.end_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <Badge className={getStatusColor(contract.status)}>{contract.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Accounting Tab */}
        <TabsContent value="accounting" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Profit & Loss</CardTitle>
                <CardDescription>Current month financial performance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Total Revenue</span>
                  <span className="font-medium">${stats.monthlyRevenue.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Cost of Goods Sold</span>
                  <span className="font-medium">$45,200</span>
                </div>
                <div className="flex justify-between">
                  <span>Operating Expenses</span>
                  <span className="font-medium">$12,800</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold">
                  <span>Net Profit</span>
                  <span>${(stats.monthlyRevenue * (stats.profitMargin / 100)).toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cash Flow</CardTitle>
                <CardDescription>Money in vs money out</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Cash Inflow</span>
                  <span className="font-medium text-green-600">+${stats.cashFlow.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Cash Outflow</span>
                  <span className="font-medium text-red-600">-$38,500</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold">
                  <span>Net Cash Flow</span>
                  <span className={stats.cashFlow > 0 ? "text-green-600" : "text-red-600"}>
                    ${stats.cashFlow.toLocaleString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Financial Reports</CardTitle>
              <CardDescription>Generate and export detailed financial reports</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card className="p-4">
                  <h3 className="font-medium mb-2">Revenue Report</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Detailed revenue breakdown by project, customer, and time period
                  </p>
                  <Button size="sm" onClick={() => exportFinancialReport("revenue", "monthly")}>
                    <Download className="w-4 h-4 mr-2" />
                    Export PDF
                  </Button>
                </Card>

                <Card className="p-4">
                  <h3 className="font-medium mb-2">Profit & Loss</h3>
                  <p className="text-sm text-gray-600 mb-4">Comprehensive P&L statement with expense categories</p>
                  <Button size="sm" onClick={() => exportFinancialReport("profit-loss", "quarterly")}>
                    <Download className="w-4 h-4 mr-2" />
                    Export PDF
                  </Button>
                </Card>

                <Card className="p-4">
                  <h3 className="font-medium mb-2">Cash Flow</h3>
                  <p className="text-sm text-gray-600 mb-4">Cash flow analysis and projections</p>
                  <Button size="sm" onClick={() => exportFinancialReport("cash-flow", "yearly")}>
                    <Download className="w-4 h-4 mr-2" />
                    Export PDF
                  </Button>
                </Card>

                <Card className="p-4">
                  <h3 className="font-medium mb-2">Tax Summary</h3>
                  <p className="text-sm text-gray-600 mb-4">Tax-ready financial summary for accounting</p>
                  <Button size="sm" onClick={() => exportFinancialReport("tax-summary", "yearly")}>
                    <Download className="w-4 h-4 mr-2" />
                    Export PDF
                  </Button>
                </Card>

                <Card className="p-4">
                  <h3 className="font-medium mb-2">Customer Analysis</h3>
                  <p className="text-sm text-gray-600 mb-4">Customer profitability and payment history</p>
                  <Button size="sm" onClick={() => exportFinancialReport("customer-analysis", "yearly")}>
                    <Download className="w-4 h-4 mr-2" />
                    Export PDF
                  </Button>
                </Card>

                <Card className="p-4">
                  <h3 className="font-medium mb-2">Project Profitability</h3>
                  <p className="text-sm text-gray-600 mb-4">Profit margins by project type and size</p>
                  <Button size="sm" onClick={() => exportFinancialReport("project-profitability", "yearly")}>
                    <Download className="w-4 h-4 mr-2" />
                    Export PDF
                  </Button>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Financial Settings</CardTitle>
              <CardDescription>Configure payment terms, tax rates, and billing preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-medium">Payment Terms</h3>
                  <div>
                    <Label htmlFor="default-terms">Default Payment Terms</Label>
                    <Select defaultValue="net-30">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="due-on-receipt">Due on Receipt</SelectItem>
                        <SelectItem value="net-15">Net 15</SelectItem>
                        <SelectItem value="net-30">Net 30</SelectItem>
                        <SelectItem value="net-60">Net 60</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="late-fee">Late Fee Percentage</Label>
                    <Input id="late-fee" type="number" defaultValue={billingSettings.lateFeePercentage} step="0.1" />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-medium">Tax Configuration</h3>
                  <div>
                    <Label htmlFor="tax-rate">Default Tax Rate (%)</Label>
                    <Input id="tax-rate" type="number" defaultValue={billingSettings.taxRate} step="0.1" />
                  </div>
                  <div>
                    <Label htmlFor="tax-id">Tax ID Number</Label>
                    <Input id="tax-id" defaultValue="XX-XXXXXXX" />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-medium">Automated Billing</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="auto-invoice">Auto-generate invoices</Label>
                      <Select defaultValue={billingSettings.autoInvoice}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="disabled">Disabled</SelectItem>
                          <SelectItem value="project-completion">On project completion</SelectItem>
                          <SelectItem value="milestone">On milestone completion</SelectItem>
                          <SelectItem value="monthly">Monthly recurring</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="reminder-schedule">Payment reminder schedule</Label>
                      <Select defaultValue={billingSettings.reminderSchedule}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="disabled">Disabled</SelectItem>
                          <SelectItem value="1-day">1 day before due</SelectItem>
                          <SelectItem value="3-days">3 days before due</SelectItem>
                          <SelectItem value="1-week">1 week before due</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="flex justify-end">
                <Button>Save Settings</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
