"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Calculator, FileText, Download, Send } from "lucide-react"

interface PricingTier {
  min: number
  max: number
  multiplier: number
}

interface ServicePackage {
  id: string
  name: string
  base_price_per_sqft: number
  description: string
  package_type: string
}

interface AddOn {
  id: string
  name: string
  price_per_sqft?: number
  fixed_price?: number
  description: string
}

export default function QuoteCalculator() {
  const [squareFootage, setSquareFootage] = useState<number>(0)
  const [selectedPackage, setSelectedPackage] = useState<ServicePackage | null>(null)
  const [selectedAddOns, setSelectedAddOns] = useState<AddOn[]>([])
  const [urgencyMultiplier, setUrgencyMultiplier] = useState<number>(1)
  const [complexityMultiplier, setComplexityMultiplier] = useState<number>(1)
  const [packages, setPackages] = useState<ServicePackage[]>([])
  const [addOns, setAddOns] = useState<AddOn[]>([])

  // Pricing tiers for volume discounts
  const pricingTiers: PricingTier[] = [
    { min: 0, max: 500, multiplier: 1.0 },
    { min: 501, max: 1500, multiplier: 0.95 },
    { min: 1501, max: 3000, multiplier: 0.9 },
    { min: 3001, max: Number.POSITIVE_INFINITY, multiplier: 0.85 },
  ]

  // Sample service packages (in real app, fetch from database)
  useEffect(() => {
    setPackages([
      {
        id: "1",
        name: "Basic Epoxy",
        base_price_per_sqft: 4.5,
        description: "Standard epoxy coating with basic color options",
        package_type: "residential",
      },
      {
        id: "2",
        name: "Premium Epoxy",
        base_price_per_sqft: 6.0,
        description: "High-performance epoxy with decorative flakes",
        package_type: "residential",
      },
      {
        id: "3",
        name: "Commercial Grade",
        base_price_per_sqft: 7.5,
        description: "Heavy-duty epoxy for commercial applications",
        package_type: "commercial",
      },
      {
        id: "4",
        name: "Industrial Coating",
        base_price_per_sqft: 9.0,
        description: "Chemical-resistant industrial grade coating",
        package_type: "industrial",
      },
    ])

    setAddOns([
      {
        id: "1",
        name: "Metallic Finish",
        price_per_sqft: 2.0,
        description: "Premium metallic pigments for unique appearance",
      },
      {
        id: "2",
        name: "Anti-Slip Additive",
        price_per_sqft: 0.75,
        description: "Safety texture for high-traffic areas",
      },
      {
        id: "3",
        name: "Concrete Repair",
        price_per_sqft: 1.5,
        description: "Crack filling and surface preparation",
      },
      {
        id: "4",
        name: "Moisture Barrier",
        price_per_sqft: 1.25,
        description: "Vapor barrier for moisture protection",
      },
      {
        id: "5",
        name: "Express Service",
        fixed_price: 500,
        description: "Rush job completion (2-3 days faster)",
      },
    ])
  }, [])

  const calculateBasePrice = (): number => {
    if (!selectedPackage || !squareFootage) return 0

    // Find applicable pricing tier
    const tier = pricingTiers.find((t) => squareFootage >= t.min && squareFootage <= t.max)
    const tierMultiplier = tier?.multiplier || 1.0

    return selectedPackage.base_price_per_sqft * squareFootage * tierMultiplier
  }

  const calculateAddOnsPrice = (): number => {
    return selectedAddOns.reduce((total, addOn) => {
      if (addOn.price_per_sqft) {
        return total + addOn.price_per_sqft * squareFootage
      } else if (addOn.fixed_price) {
        return total + addOn.fixed_price
      }
      return total
    }, 0)
  }

  const calculateSubtotal = (): number => {
    const basePrice = calculateBasePrice()
    const addOnsPrice = calculateAddOnsPrice()
    return (basePrice + addOnsPrice) * urgencyMultiplier * complexityMultiplier
  }

  const calculateTax = (): number => {
    return calculateSubtotal() * 0.08 // 8% tax rate
  }

  const calculateTotal = (): number => {
    return calculateSubtotal() + calculateTax()
  }

  const handleAddOnToggle = (addOn: AddOn, checked: boolean) => {
    if (checked) {
      setSelectedAddOns([...selectedAddOns, addOn])
    } else {
      setSelectedAddOns(selectedAddOns.filter((a) => a.id !== addOn.id))
    }
  }

  const generateEstimate = () => {
    const estimate = {
      package: selectedPackage,
      squareFootage,
      addOns: selectedAddOns,
      pricing: {
        basePrice: calculateBasePrice(),
        addOnsPrice: calculateAddOnsPrice(),
        subtotal: calculateSubtotal(),
        tax: calculateTax(),
        total: calculateTotal(),
      },
      multipliers: {
        urgency: urgencyMultiplier,
        complexity: complexityMultiplier,
      },
      generatedAt: new Date().toISOString(),
    }

    // In real app, save to database and generate PDF
    console.log("Generated Estimate:", estimate)
    alert("Estimate generated! In a real app, this would create a PDF and save to database.")
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calculator className="w-5 h-5 mr-2" />
            Advanced Quote Calculator
          </CardTitle>
          <CardDescription>Configure your project details to get an accurate estimate</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Square Footage Input */}
          <div className="space-y-2">
            <Label htmlFor="square-footage">Square Footage</Label>
            <Input
              id="square-footage"
              type="number"
              placeholder="Enter square footage"
              value={squareFootage || ""}
              onChange={(e) => setSquareFootage(Number(e.target.value))}
            />
            {squareFootage > 0 && (
              <div className="text-sm text-gray-600">
                Volume discount tier:{" "}
                {pricingTiers.find((t) => squareFootage >= t.min && squareFootage <= t.max)?.multiplier === 1.0
                  ? "Standard"
                  : `${((1 - (pricingTiers.find((t) => squareFootage >= t.min && squareFootage <= t.max)?.multiplier || 1)) * 100).toFixed(0)}% discount`}
              </div>
            )}
          </div>

          {/* Service Package Selection */}
          <div className="space-y-4">
            <Label>Service Package</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {packages.map((pkg) => (
                <Card
                  key={pkg.id}
                  className={`cursor-pointer transition-all ${selectedPackage?.id === pkg.id ? "ring-2 ring-blue-500 bg-blue-50" : "hover:shadow-md"}`}
                  onClick={() => setSelectedPackage(pkg)}
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold">{pkg.name}</h3>
                      <Badge variant="outline">{pkg.package_type}</Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{pkg.description}</p>
                    <p className="text-lg font-bold text-blue-600">${pkg.base_price_per_sqft.toFixed(2)}/sq ft</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Add-ons Selection */}
          <div className="space-y-4">
            <Label>Add-ons & Upgrades</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {addOns.map((addOn) => (
                <div key={addOn.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                  <Checkbox
                    id={addOn.id}
                    checked={selectedAddOns.some((a) => a.id === addOn.id)}
                    onCheckedChange={(checked) => handleAddOnToggle(addOn, checked as boolean)}
                  />
                  <div className="flex-1">
                    <Label htmlFor={addOn.id} className="font-medium cursor-pointer">
                      {addOn.name}
                    </Label>
                    <p className="text-sm text-gray-600">{addOn.description}</p>
                    <p className="text-sm font-semibold text-green-600">
                      {addOn.price_per_sqft
                        ? `+$${addOn.price_per_sqft.toFixed(2)}/sq ft`
                        : addOn.fixed_price
                          ? `+$${addOn.fixed_price.toFixed(2)}`
                          : "Included"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Project Complexity & Urgency */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="urgency">Project Urgency</Label>
              <Select
                value={urgencyMultiplier.toString()}
                onValueChange={(value) => setUrgencyMultiplier(Number(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Standard Timeline (No rush)</SelectItem>
                  <SelectItem value="1.15">Expedited (15% surcharge)</SelectItem>
                  <SelectItem value="1.25">Rush Job (25% surcharge)</SelectItem>
                  <SelectItem value="1.4">Emergency (40% surcharge)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="complexity">Project Complexity</Label>
              <Select
                value={complexityMultiplier.toString()}
                onValueChange={(value) => setComplexityMultiplier(Number(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Standard (Open floor)</SelectItem>
                  <SelectItem value="1.1">Moderate (Some obstacles)</SelectItem>
                  <SelectItem value="1.2">Complex (Many obstacles/cuts)</SelectItem>
                  <SelectItem value="1.35">Very Complex (Intricate work)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pricing Breakdown */}
      {selectedPackage && squareFootage > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pricing Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Base Price ({selectedPackage.name})</span>
                <span>${calculateBasePrice().toFixed(2)}</span>
              </div>

              {selectedAddOns.length > 0 && (
                <>
                  <Separator />
                  <div className="text-sm font-medium text-gray-700">Add-ons:</div>
                  {selectedAddOns.map((addOn) => (
                    <div key={addOn.id} className="flex justify-between text-sm">
                      <span className="ml-4">{addOn.name}</span>
                      <span>
                        $
                        {addOn.price_per_sqft
                          ? (addOn.price_per_sqft * squareFootage).toFixed(2)
                          : addOn.fixed_price?.toFixed(2) || "0.00"}
                      </span>
                    </div>
                  ))}
                </>
              )}

              {(urgencyMultiplier !== 1 || complexityMultiplier !== 1) && (
                <>
                  <Separator />
                  <div className="text-sm font-medium text-gray-700">Adjustments:</div>
                  {urgencyMultiplier !== 1 && (
                    <div className="flex justify-between text-sm">
                      <span className="ml-4">Urgency Surcharge ({((urgencyMultiplier - 1) * 100).toFixed(0)}%)</span>
                      <span>
                        +${((calculateBasePrice() + calculateAddOnsPrice()) * (urgencyMultiplier - 1)).toFixed(2)}
                      </span>
                    </div>
                  )}
                  {complexityMultiplier !== 1 && (
                    <div className="flex justify-between text-sm">
                      <span className="ml-4">
                        Complexity Surcharge ({((complexityMultiplier - 1) * 100).toFixed(0)}%)
                      </span>
                      <span>
                        +$
                        {(
                          (calculateBasePrice() + calculateAddOnsPrice()) *
                          urgencyMultiplier *
                          (complexityMultiplier - 1)
                        ).toFixed(2)}
                      </span>
                    </div>
                  )}
                </>
              )}

              <Separator />
              <div className="flex justify-between font-medium">
                <span>Subtotal</span>
                <span>${calculateSubtotal().toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax (8%)</span>
                <span>${calculateTax().toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>${calculateTotal().toFixed(2)}</span>
              </div>
            </div>

            <div className="flex space-x-3 pt-4">
              <Button onClick={generateEstimate} className="flex-1">
                <FileText className="w-4 h-4 mr-2" />
                Generate Formal Estimate
              </Button>
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </Button>
              <Button variant="outline">
                <Send className="w-4 h-4 mr-2" />
                Email Quote
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
