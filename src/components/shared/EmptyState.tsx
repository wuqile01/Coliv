import { cn } from "@/lib/utils";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: { label: string; href?: string; onClick?: () => void };
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-14 px-6 text-center", className)}>
      <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-3">
        <Icon className="h-7 w-7 text-muted-foreground/50" />
      </div>
      <p className="text-sm font-semibold text-foreground">{title}</p>
      {description && (
        <p className="text-xs text-muted-foreground mt-1 max-w-xs leading-relaxed">{description}</p>
      )}
      {action && (
        action.href ? (
          <Button asChild size="sm" className="mt-4">
            <Link href={action.href}>{action.label}</Link>
          </Button>
        ) : (
          <Button size="sm" className="mt-4" onClick={action.onClick}>
            {action.label}
          </Button>
        )
      )}
    </div>
  );
}
