import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function SignUpSuccessPage() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6 md:p-10 bg-gradient-to-br from-green-50 to-green-100">
      <div className="w-full max-w-sm">
        <Card className="border-green-200">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-green-800">Check Your Email</CardTitle>
            <CardDescription>We've sent you a confirmation link</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Please check your email and click the confirmation link to activate your account.
            </p>
            <Button asChild className="bg-green-600 hover:bg-green-700">
              <Link href="/">Return to Homepage</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
