import {
  Backpack,
  BadgeDollarSign,
  Boxes,
  Camera,
  CalendarSync,
  Compass,
  Droplets,
  Film,
  GalleryVerticalEnd,
  GraduationCap,
  MailOpen,
  Package,
  PhoneCall,
  Repeat2,
  Route,
  ShieldAlert,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  backpack: Backpack,
  "badge-dollar-sign": BadgeDollarSign,
  boxes: Boxes,
  camera: Camera,
  "calendar-sync": CalendarSync,
  compass: Compass,
  droplets: Droplets,
  film: Film,
  "gallery-vertical-end": GalleryVerticalEnd,
  "graduation-cap": GraduationCap,
  "mail-open": MailOpen,
  package: Package,
  "phone-call": PhoneCall,
  repeat: Repeat2,
  route: Route,
  "shield-alert": ShieldAlert,
  sparkles: Sparkles,
};

export function OfferingIcon({
  iconName,
  className,
}: {
  iconName?: string | null;
  className?: string;
}) {
  const Icon = iconName ? iconMap[iconName] : Package;
  return <Icon className={className} />;
}
