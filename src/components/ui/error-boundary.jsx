import { Component } from "react"
import { AlertTriangle, RefreshCw, Home } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Alert,
  AlertTitle,
  AlertDescription,
} from "@/components/ui/alert"

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
    this.reset = this.reset.bind(this)
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error("[ErrorBoundary]", error, info.componentStack)
  }

  reset() {
    this.setState({ error: null })
    this.props.onReset?.()
  }

  render() {
    if (!this.state.error) return this.props.children

    const { fullPage = false, title = "Something went wrong", className } = this.props
    const message = this.state.error?.message || "An unexpected error occurred."

    if (fullPage) {
      return (
        <div className="h-screen flex flex-col items-center justify-center bg-background px-4">
          <Alert variant="destructive" className="mb-6 max-w-md">
            <AlertTriangle className="size-4" />
            <AlertTitle>{title}</AlertTitle>
            <AlertDescription>{message}</AlertDescription>
          </Alert>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => window.location.assign("/")}>
              <Home className="size-4" />
              Go home
            </Button>
            <Button variant="outline" onClick={() => window.location.reload()}>
              <RefreshCw className="size-4" />
              Refresh page
            </Button>
            <Button onClick={this.reset}>Try again</Button>
          </div>
        </div>
      )
    }

    return (
      <div className={cn("flex flex-col items-center justify-center py-16 px-4 text-center", className)}>
        <Alert variant="destructive" className="mb-5 max-w-sm text-left">
          <AlertTriangle className="size-4" />
          <AlertTitle>{title}</AlertTitle>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
        <Button size="sm" variant="outline" onClick={this.reset}>
          <RefreshCw className="size-4" />
          Try again
        </Button>
      </div>
    )
  }
}

export { ErrorBoundary }
