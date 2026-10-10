import { ReactNode, HTMLAttributes } from "react";
import clsx from "clsx";

interface StampCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  punched?: boolean;
  padded?: boolean;
}

export function StampCard({ children, punched = false, padded = true, className, ...rest }: StampCardProps) {
  return (
    <div className={clsx("stamp-card relative", padded && "p-5", punched && "pt-9", className)} {...rest}>
      {punched && (
        <div className="punch-holes">
          <span /><span />
        </div>
      )}
      {children}
    </div>
  );
}
