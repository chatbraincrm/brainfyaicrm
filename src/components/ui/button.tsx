import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium",
    "ring-offset-background transition-all duration-200",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    "disabled:pointer-events-none disabled:opacity-50",
    "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  ].join(" "),
  {
    variants: {
      variant: {
        default: [
          "gradient-primary text-primary-foreground font-semibold",
          "shadow-sm hover:shadow-md hover:shadow-primary/25",
          "active:scale-[0.98]",
        ].join(" "),
        destructive: [
          "bg-destructive text-destructive-foreground",
          "hover:bg-destructive/90 active:scale-[0.98]",
        ].join(" "),
        outline: [
          "border border-border bg-transparent text-foreground",
          "hover:bg-secondary hover:border-primary/40",
          "active:scale-[0.98]",
        ].join(" "),
        secondary: [
          "bg-secondary text-secondary-foreground",
          "hover:bg-secondary/70 active:scale-[0.98]",
        ].join(" "),
        ghost: [
          "text-foreground",
          "hover:bg-secondary hover:text-foreground",
          "active:scale-[0.98]",
        ].join(" "),
        link: "text-primary underline-offset-4 hover:underline",
        glow: [
          "gradient-primary text-primary-foreground font-semibold",
          "shadow-glow hover:shadow-glow animate-pulse-glow",
          "active:scale-[0.98]",
        ].join(" "),
        soft: [
          "bg-primary/10 text-primary font-medium",
          "hover:bg-primary/18 active:scale-[0.98]",
        ].join(" "),
        "soft-destructive": [
          "bg-destructive/10 text-destructive font-medium",
          "hover:bg-destructive/18 active:scale-[0.98]",
        ].join(" "),
      },
      size: {
        xs: "h-7 rounded-md px-2.5 text-xs",
        sm: "h-8 rounded-md px-3 text-sm",
        default: "h-9 px-4 py-2",
        lg: "h-11 rounded-lg px-6 text-base",
        xl: "h-13 rounded-xl px-8 text-lg font-semibold",
        icon: "h-9 w-9",
        "icon-sm": "h-7 w-7 rounded-md",
        "icon-xs": "h-6 w-6 rounded-md",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
