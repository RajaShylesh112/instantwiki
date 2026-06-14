import { cn } from "@/lib/utils"
import { ExternalLink } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

interface CustomLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string
}

const CustomLink = ({
  href,
  children,
  className,
  ...rest
}: CustomLinkProps) => {
  const isInternalLink = href.startsWith("/")
  const isAnchorLink = href.startsWith("#")

  if (isInternalLink || isAnchorLink) {
    return (
      <Button variant="link" className={cn("h-auto p-0 text-inherit", className)} asChild>
        <Link href={href} {...rest as any}>
          {children}
        </Link>
      </Button>
    )
  }

  return (
    <Button variant="link" className={cn("h-auto p-0 inline-flex items-center gap-1 align-baseline text-inherit", className)} asChild>
      <Link
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        {...rest as any}
      >
        <span>{children}</span>
        <ExternalLink className="ml-0.5 inline-block h-4 w-4" />
      </Link>
    </Button>
  )
}

export default CustomLink
