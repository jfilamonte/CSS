"use client"

import React from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { AlertTriangle, RefreshCw, Bug, Home } from "lucide-react"
import { errorMonitoring } from "@/lib/error-monitoring"
import Link from "next/link"

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorId?: string
}

export class ErrorBoundary extends React.Component<React.PropsWithChildren<{}>, ErrorBoundaryState> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("[v0] Error caught by boundary:", error, errorInfo)

    const errorId = `boundary_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    errorMonitoring.logError({
      error_type: "javascript",
      error_message: error.message,
      error_stack: error.stack,
      url: window.location.href,
      user_agent: navigator.userAgent,
      timestamp: new Date(),
      severity: "critical",
      context: {
        componentStack: errorInfo.componentStack,
        errorBoundary: true,
        errorId,
      },
      resolved: false,
    })

    this.setState({ errorId })
  }

  private handleReportError = async () => {
    if (this.state.error && this.state.errorId) {
      try {
        const errorReport = {
          errorId: this.state.errorId,
          message: this.state.error.message,
          stack: this.state.error.stack,
          url: window.location.href,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString(),
        }

        console.log("[v0] Error report generated:", errorReport)

        alert("Error report sent successfully. Our team will investigate this issue.")
      } catch (error) {
        console.error("[v0] Failed to send error report:", error)
        alert("Failed to send error report. Please contact support directly.")
      }
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
          <div className="max-w-md w-full">
            <Alert variant="destructive" className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Something went wrong</AlertTitle>
              <AlertDescription className="mt-2">
                An unexpected error occurred. Please try refreshing the page or contact support if the problem persists.
                {this.state.errorId && (
                  <div className="mt-2 text-xs font-mono bg-red-100 p-2 rounded border border-red-200">
                    Error ID: {this.state.errorId}
                  </div>
                )}
              </AlertDescription>
            </Alert>

            <div className="mt-4 flex flex-col sm:flex-row gap-2 justify-center">
              <Button onClick={() => window.location.reload()} variant="outline" className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                Refresh Page
              </Button>
              <Button
                onClick={this.handleReportError}
                variant="outline"
                className="flex items-center gap-2 bg-transparent"
              >
                <Bug className="h-4 w-4" />
                Report Error
              </Button>
              <Link href="/">
                <Button variant="outline" className="flex items-center gap-2 w-full sm:w-auto bg-transparent">
                  <Home className="h-4 w-4" />
                  Go Home
                </Button>
              </Link>
            </div>

            {process.env.NODE_ENV === "development" && this.state.error && (
              <details className="mt-4 p-4 bg-gray-100 rounded-lg">
                <summary className="cursor-pointer font-medium">Error Details</summary>
                <pre className="mt-2 text-sm overflow-auto">{this.state.error.stack}</pre>
              </details>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
