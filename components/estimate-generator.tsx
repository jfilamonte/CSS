"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { FileText, Calendar, DollarSign, User, MapPin } from "lucide-react"

interface EstimateData {
  customer: {
    name: string
    email: string
    phone: string
    address: string
  }
  project: {
    title: string
    description: string
    address: string
    squareFootage: number
    timeline: string
  }
  pricing: {
    lineItems: Array<{
      description: string
      quantity: number
      unit: string
      unitPrice: number
      total: number
    }>
    subtotal: number
    tax: number
    total: number
  }
  terms: {
    validUntil: string
    depositPercentage: number
    paymentTerms: string
    warranty: string
  }
}

export default function EstimateGenerator() {
  const [estimateData, setEstimateData] = useState<EstimateData>({
    customer: {
      name: "",
      email: "",
      phone: "",
      address: "",
    },
    project: {
      title: "",
      description: "",
      address: "",
      squareFootage: 0,
      timeline: "",
    },
    pricing: {
      lineItems: [
        {
          description: "Surface Preparation",
          quantity: 0,
          unit: "sq ft",
          unitPrice: 1.5,
          total: 0,
        },
        {
          description: "Epoxy Base Coat",
          quantity: 0,
          unit: "sq ft",
          unitPrice: 3.0,
          total: 0,
        },
        {
          description: "Decorative Flakes",
          quantity: 0,
          unit: "sq ft",
          unitPrice: 1.0,
          total: 0,
        },
        {
          description: "Clear Top Coat",
          quantity: 0,
          unit: "sq ft",
          unitPrice: 2.5,
          total: 0,
        },
      ],
      subtotal: 0,
      tax: 0,
      total: 0,
    },
    terms: {
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      depositPercentage: 50,
      paymentTerms: "50% deposit, 50% on completion",
      warranty: "5 years on materials and workmanship",
    },
  })

  const updateLineItem = (index: number, field: string, value: any) => {
    const newLineItems = [...estimateData.pricing.lineItems]
    newLineItems[index] = { ...newLineItems[index], [field]: value }

    // Recalculate total for this line item
    if (field === "quantity" || field === "unitPrice") {
      newLineItems[index].total = newLineItems[index].quantity * newLineItems[index].unitPrice
    }

    // Recalculate totals
    const subtotal = newLineItems.reduce((sum, item) => sum + item.total, 0)
    const tax = subtotal * 0.08
    const total = subtotal + tax

    setEstimateData({
      ...estimateData,
      pricing: {
        ...estimateData.pricing,
        lineItems: newLineItems,
        subtotal,
        tax,
        total,
      },
    })
  }

  const addLineItem = () => {
    setEstimateData({
      ...estimateData,
      pricing: {
        ...estimateData.pricing,
        lineItems: [
          ...estimateData.pricing.lineItems,
          {
            description: "",
            quantity: 0,
            unit: "sq ft",
            unitPrice: 0,
            total: 0,
          },
        ],
      },
    })
  }

  const removeLineItem = (index: number) => {
    const newLineItems = estimateData.pricing.lineItems.filter((_, i) => i !== index)
    const subtotal = newLineItems.reduce((sum, item) => sum + item.total, 0)
    const tax = subtotal * 0.08
    const total = subtotal + tax

    setEstimateData({
      ...estimateData,
      pricing: {
        ...estimateData.pricing,
        lineItems: newLineItems,
        subtotal,
        tax,
        total,
      },
    })
  }

  const generateEstimate = async () => {
    try {
      // In real app, save to database and generate PDF
      const estimateNumber = `CSS-EST-${Date.now()}`

      console.log("Generated Estimate:", {
        estimateNumber,
        ...estimateData,
        generatedAt: new Date().toISOString(),
      })

      alert(
        `Estimate ${estimateNumber} generated successfully! In a real app, this would create a PDF and save to database.`,
      )
    } catch (error) {
      console.error("Error generating estimate:", error)
      alert("Error generating estimate. Please try again.")
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="w-5 h-5 mr-2" />
            Professional Estimate Generator
          </CardTitle>
          <CardDescription>
            Create detailed estimates with line items, terms, and professional formatting
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Customer Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center">
              <User className="w-4 h-4 mr-2" />
              Customer Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="customer-name">Customer Name</Label>
                <Input
                  id="customer-name"
                  value={estimateData.customer.name}
                  onChange={(e) =>
                    setEstimateData({
                      ...estimateData,
                      customer: { ...estimateData.customer, name: e.target.value },
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="customer-email">Email</Label>
                <Input
                  id="customer-email"
                  type="email"
                  value={estimateData.customer.email}
                  onChange={(e) =>
                    setEstimateData({
                      ...estimateData,
                      customer: { ...estimateData.customer, email: e.target.value },
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="customer-phone">Phone</Label>
                <Input
                  id="customer-phone"
                  value={estimateData.customer.phone}
                  onChange={(e) =>
                    setEstimateData({
                      ...estimateData,
                      customer: { ...estimateData.customer, phone: e.target.value },
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="customer-address">Customer Address</Label>
                <Input
                  id="customer-address"
                  value={estimateData.customer.address}
                  onChange={(e) =>
                    setEstimateData({
                      ...estimateData,
                      customer: { ...estimateData.customer, address: e.target.value },
                    })
                  }
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Project Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center">
              <MapPin className="w-4 h-4 mr-2" />
              Project Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="project-title">Project Title</Label>
                <Input
                  id="project-title"
                  value={estimateData.project.title}
                  onChange={(e) =>
                    setEstimateData({
                      ...estimateData,
                      project: { ...estimateData.project, title: e.target.value },
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="square-footage">Square Footage</Label>
                <Input
                  id="square-footage"
                  type="number"
                  value={estimateData.project.squareFootage || ""}
                  onChange={(e) =>
                    setEstimateData({
                      ...estimateData,
                      project: { ...estimateData.project, squareFootage: Number(e.target.value) },
                    })
                  }
                />
              </div>
            </div>
            <div>
              <Label htmlFor="project-address">Project Address</Label>
              <Input
                id="project-address"
                value={estimateData.project.address}
                onChange={(e) =>
                  setEstimateData({
                    ...estimateData,
                    project: { ...estimateData.project, address: e.target.value },
                  })
                }
              />
            </div>
            <div>
              <Label htmlFor="project-description">Project Description</Label>
              <Textarea
                id="project-description"
                rows={3}
                value={estimateData.project.description}
                onChange={(e) =>
                  setEstimateData({
                    ...estimateData,
                    project: { ...estimateData.project, description: e.target.value },
                  })
                }
              />
            </div>
            <div>
              <Label htmlFor="timeline">Timeline</Label>
              <Select
                value={estimateData.project.timeline}
                onValueChange={(value) =>
                  setEstimateData({
                    ...estimateData,
                    project: { ...estimateData.project, timeline: value },
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select timeline" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1-2 weeks">1-2 weeks</SelectItem>
                  <SelectItem value="2-3 weeks">2-3 weeks</SelectItem>
                  <SelectItem value="3-4 weeks">3-4 weeks</SelectItem>
                  <SelectItem value="1-2 months">1-2 months</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* Line Items */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold flex items-center">
                <DollarSign className="w-4 h-4 mr-2" />
                Line Items
              </h3>
              <Button onClick={addLineItem} variant="outline" size="sm">
                Add Line Item
              </Button>
            </div>

            <div className="space-y-3">
              {estimateData.pricing.lineItems.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-4">
                    <Label className="text-xs">Description</Label>
                    <Input
                      value={item.description}
                      onChange={(e) => updateLineItem(index, "description", e.target.value)}
                      placeholder="Item description"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label className="text-xs">Quantity</Label>
                    <Input
                      type="number"
                      value={item.quantity || ""}
                      onChange={(e) => updateLineItem(index, "quantity", Number(e.target.value))}
                    />
                  </div>
                  <div className="col-span-2">
                    <Label className="text-xs">Unit</Label>
                    <Select value={item.unit} onValueChange={(value) => updateLineItem(index, "unit", value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sq ft">sq ft</SelectItem>
                        <SelectItem value="linear ft">linear ft</SelectItem>
                        <SelectItem value="each">each</SelectItem>
                        <SelectItem value="hour">hour</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-xs">Unit Price</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={item.unitPrice || ""}
                      onChange={(e) => updateLineItem(index, "unitPrice", Number(e.target.value))}
                    />
                  </div>
                  <div className="col-span-1">
                    <Label className="text-xs">Total</Label>
                    <div className="h-10 flex items-center font-medium">${item.total.toFixed(2)}</div>
                  </div>
                  <div className="col-span-1">
                    <Button onClick={() => removeLineItem(index)} variant="outline" size="sm" className="h-10">
                      ×
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="border-t pt-4">
              <div className="flex justify-end">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>${estimateData.pricing.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax (8%):</span>
                    <span>${estimateData.pricing.tax.toFixed(2)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total:</span>
                    <span>${estimateData.pricing.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Terms and Conditions */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center">
              <Calendar className="w-4 h-4 mr-2" />
              Terms & Conditions
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="valid-until">Valid Until</Label>
                <Input
                  id="valid-until"
                  type="date"
                  value={estimateData.terms.validUntil}
                  onChange={(e) =>
                    setEstimateData({
                      ...estimateData,
                      terms: { ...estimateData.terms, validUntil: e.target.value },
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="deposit">Deposit Percentage</Label>
                <Input
                  id="deposit"
                  type="number"
                  value={estimateData.terms.depositPercentage}
                  onChange={(e) =>
                    setEstimateData({
                      ...estimateData,
                      terms: { ...estimateData.terms, depositPercentage: Number(e.target.value) },
                    })
                  }
                />
              </div>
            </div>
            <div>
              <Label htmlFor="payment-terms">Payment Terms</Label>
              <Input
                id="payment-terms"
                value={estimateData.terms.paymentTerms}
                onChange={(e) =>
                  setEstimateData({
                    ...estimateData,
                    terms: { ...estimateData.terms, paymentTerms: e.target.value },
                  })
                }
              />
            </div>
            <div>
              <Label htmlFor="warranty">Warranty</Label>
              <Input
                id="warranty"
                value={estimateData.terms.warranty}
                onChange={(e) =>
                  setEstimateData({
                    ...estimateData,
                    terms: { ...estimateData.terms, warranty: e.target.value },
                  })
                }
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-6">
            <Button variant="outline">Save Draft</Button>
            <Button onClick={generateEstimate}>Generate Estimate</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
