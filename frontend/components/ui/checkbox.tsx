import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  error?: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, error, ...props }, ref) => {
    const id = React.useId();
    return (
      <div className="flex flex-col space-y-1">
        <label className="flex items-center space-x-2.5 cursor-pointer select-none group">
          <div className="relative">
            <input
              type="checkbox"
              ref={ref}
              id={props.id || id}
              className="sr-only peer"
              {...props}
            />
            <div
              className={cn(
                "h-5 w-5 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 transition-all duration-200 flex items-center justify-center peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 peer-checked:bg-primary peer-checked:border-primary group-hover:border-zinc-400 dark:group-hover:border-zinc-600 peer-checked:group-hover:bg-primary-hover",
                error && "border-red-500 dark:border-red-800"
              )}
            >
              <Check className="h-3.5 w-3.5 text-white scale-0 peer-checked:scale-100 transition-transform duration-200 stroke-[3]" />
            </div>
          </div>
          {label && (
            <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-950 dark:group-hover:text-zinc-50 transition-colors">
              {label}
            </span>
          )}
        </label>
        {error && <p className="text-xs font-medium text-red-500 dark:text-red-400 pl-7">{error}</p>}
      </div>
    );
  }
);
Checkbox.displayName = "Checkbox";
