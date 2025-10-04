import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { type VariantProps } from "class-variance-authority";
import { buttonVariants } from "@/components/ui/buttonVariants";
import { motion, type MotionProps, type HTMLMotionProps } from "framer-motion";

import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  // Optional motion props bag; this keeps motion typing isolated instead of merging conflicting props
  motionProps?: MotionProps;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant, size, asChild = false, motionProps, ...rest }: ButtonProps,
    ref,
  ) => {
    const Comp = asChild ? Slot : "button";

  const restProps = rest as React.ButtonHTMLAttributes<HTMLButtonElement>;
    const hasMotionProp = !!motionProps && Object.keys(motionProps).length > 0;

    const classNames = cn(buttonVariants({ variant, size, className }));

    if (asChild) {
      // When using asChild (Slot) we should not forward motion props to the child DOM node
      return <Comp className={classNames} ref={ref} {...restProps} />;
    }

    if (hasMotionProp) {
      // Render a motion.button when motion props are present
      return (
        <motion.button
          className={classNames}
          ref={ref}
          {...(motionProps as MotionProps)}
          {...(restProps as unknown as HTMLMotionProps<"button">)}
        />
      );
    }

    return <Comp className={classNames} ref={ref} {...restProps} />;
  },
);
Button.displayName = "Button";
export { Button };
