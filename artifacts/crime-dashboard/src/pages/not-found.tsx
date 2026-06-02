import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="h-full w-full flex items-center justify-center">
      <Card className="w-full max-w-md mx-4 bg-card border-border">
        <CardContent className="pt-6 flex flex-col items-center">
          <div className="flex flex-col items-center gap-4 text-center">
            <AlertCircle className="h-12 w-12 text-destructive" />
            <h1 className="text-2xl font-bold text-foreground">404 - Area Not Found</h1>
            <p className="text-sm text-muted-foreground">
              The sector you are trying to access does not exist or requires higher clearance.
            </p>
            <Link href="/" className="mt-4 text-sm text-primary hover:underline">
              Return to Command Center
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
