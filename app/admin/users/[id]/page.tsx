"use client"
import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Edit, Mail, Phone, MapPin } from "lucide-react"

interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  phone: string
  address?: string
  city?: string
  state?: string
  zip_code?: string
  role: string
  is_active: boolean
  created_at: string
}

interface Quote {
  id: string
  customer_name: string
  customer_email: string
  project_address: string
  square_footage: number
  status: string
  total_cost: number
  created_at: string
}

export default function UserDetailPage() {
  const router = useRouter()
  const params = useParams()
  const [user, setUser] = useState<User | null>(null)
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const userId = params.id as string

        // Load user details
        const { data: userData, error: userError } = await supabase.from("users").select("*").eq("id", userId).single()

        if (userError) throw userError
        setUser(userData)

        // Load user quotes
        const { data: quotesData, error: quotesError } = await supabase
          .from("quotes")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })

        if (quotesError) throw quotesError
        setQuotes(quotesData || [])
      } catch (error) {
        console.error("[v0] Error loading user data:", error)
      } finally {
        setLoading(false)
      }
    }

    loadUserData()
  }, [params.id])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading user details...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">User not found</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Admin
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>
                    {user.first_name} {user.last_name}
                  </span>
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">{user.email}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">{user.phone}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">
                    {user.address}, {user.city}, {user.state} {user.zip_code}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Role:</span>
                  <Badge>{user.role}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Status:</span>
                  <Badge variant={user.is_active ? "default" : "destructive"}>
                    {user.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Member Since:</span>
                  <span className="text-sm">{new Date(user.created_at).toLocaleDateString()}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Quote History ({quotes.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Project Address
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Sq Ft</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {quotes.map((quote) => (
                        <tr key={quote.id} className="hover:bg-gray-50">
                          <td className="px-4 py-2 text-sm">{quote.project_address}</td>
                          <td className="px-4 py-2 text-sm">{quote.square_footage?.toLocaleString()}</td>
                          <td className="px-4 py-2">
                            <Badge variant={quote.status === "approved" ? "default" : "secondary"}>
                              {quote.status}
                            </Badge>
                          </td>
                          <td className="px-4 py-2 text-sm">${quote.total_cost?.toLocaleString()}</td>
                          <td className="px-4 py-2 text-sm">{new Date(quote.created_at).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
