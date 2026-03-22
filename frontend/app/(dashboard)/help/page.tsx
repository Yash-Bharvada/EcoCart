import React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { HelpCircle, Mail, MessageSquare, FileText } from "lucide-react"

export default function HelpPage() {
  return (
    <div className="container max-w-5xl mx-auto p-4 md:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Help Center</h1>
        <p className="text-muted-foreground">Find answers and support for EcoCart</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              FAQ
            </CardTitle>
            <CardDescription>Frequently asked questions about carbon footprint analysis</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-foreground space-y-2">
            <p><strong>How does receipt scanning work?</strong><br />Our AI processes your uploaded receipt and identifies sustainable alternatives.</p>
            <p><strong>Is this service free?</strong><br />Yes, EcoCart is now 100% free and open-source.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              Community
            </CardTitle>
            <CardDescription>Join our forums and connect</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Get involved with the EcoCart community, share eco tips, and vote on features.
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              Contact Us
            </CardTitle>
            <CardDescription>Get technical support</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Email us directly at <strong>support@ecocart.com</strong> for swift assistance.
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
