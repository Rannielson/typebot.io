import { ZapIcon } from "@typebot.io/ui/icons/ZapIcon";
import { cn } from "@typebot.io/ui/lib/cn";

export const HinovaLogo = ({
  className,
  ...props
}: React.SVGProps<SVGSVGElement>) => (
  <ZapIcon className={cn(className)} {...props} />
);
