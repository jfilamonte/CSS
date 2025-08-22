"use client"

import { useActionState } from "react"
import { useFormStatus } from "react-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { registerCustomer } from "@/lib/actions"

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <Button
      type="submit"
      disabled={pending}
      className="w-full bg-[#2b725e] hover:bg-[#235e4c] text-white py-6 text-lg font-medium rounded-lg h-[60px]"
    >
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Creating Account...
        </>
      ) : (
        "Create Account"
      )}
    </Button>
  )
}

export default function CustomerRegisterForm() {
  const router = useRouter()
  const [state, formAction] = useActionState(registerCustomer, null)

  useEffect(() => {
    if (state?.success) {
      router.push("/customer-portal")
    }
  }, [state, router])

  return (
    <div className="w-full max-w-md space-y-8">
      <div className="space-y-2 text-center">
        <h1 className="text-4xl font-semibold tracking-tight text-white">Join Our Portal</h1>
        <p className="text-lg text-gray-400">Create an account to track your projects</p>
      </div>

      <form action={formAction} className="space-y-6">
        {state?.error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-700 px-4 py-3 rounded">{state.error}</div>
        )}

        {state?.success && (
          <div className="bg-green-500/10 border border-green-500/50 text-green-700 px-4 py-3 rounded">
            Account created successfully! Redirecting to portal...
          </div>
        )}

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-300">
                First Name
              </label>
              <Input
                id="firstName"
                name="firstName"
                type="text"
                placeholder="John"
                required
                className="bg-[#1c1c1c] border-gray-800 text-white placeholder:text-gray-500"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-300">
                Last Name
              </label>
              <Input
                id="lastName"
                name="lastName"
                type="text"
                placeholder="Doe"
                required
                className="bg-[#1c1c1c] border-gray-800 text-white placeholder:text-gray-500"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium text-gray-300">
              Email
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              required
              className="bg-[#1c1c1c] border-gray-800 text-white placeholder:text-gray-500"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="phone" className="block text-sm font-medium text-gray-300">
              Phone Number
            </label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              placeholder="(555) 123-4567"
              required
              className="bg-[#1c1c1c] border-gray-800 text-white placeholder:text-gray-500"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="block text-sm font-medium text-gray-300">
              Password
            </label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Create a secure password"
              required
              minLength={6}
              className="bg-[#1c1c1c] border-gray-800 text-white"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300">
              Confirm Password
            </label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="Confirm your password"
              required
              minLength={6}
              className="bg-[#1c1c1c] border-gray-800 text-white"
            />
          </div>
        </div>

        <SubmitButton />

        <div className="text-center text-gray-400">
          Already have an account?{" "}
          <Link href="/auth/customer-login" className="text-white hover:underline">
            Sign in here
          </Link>
        </div>
      </form>
    </div>
  )
}
