import * as React from "react";
import { ChevronDown, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "children"> {
  label: string;
  options: SelectOption[];
  placeholder?: string;
  error?: string;
  icon?: React.ReactNode;
  isLoading?: boolean;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, options, placeholder, error, icon, isLoading, ...props }, ref) => {
    return (
      <div className="w-full flex flex-col space-y-1.5">
        <label className="text-xs font-bold text-zinc-700 select-none">
          {label}
        </label>

        <div className="relative">
          {/* Left icon */}
          {icon && (
            <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-zinc-400">
              {icon}
            </div>
          )}

          <select
            ref={ref}
            className={cn(
              "block w-full h-12 text-sm text-zinc-800 bg-white border border-zinc-200 rounded-xl",
              "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary",
              "transition-all duration-200 font-medium appearance-none cursor-pointer",
              "disabled:cursor-not-allowed disabled:opacity-60",
              icon ? "pl-11" : "px-4",
              "pr-10",
              error && "border-red-500 focus:ring-red-500/20 focus:border-red-500",
              !props.value && "text-zinc-400",
              className
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {isLoading ? "Loading…" : placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} className="text-zinc-800">
                {opt.label}
              </option>
            ))}
          </select>

          {/* Chevron icon */}
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-zinc-400">
            {isLoading ? (
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </div>
        </div>

        <AnimatePresence initial={false}>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -5 }}
              animate={{ opacity: 1, height: "auto", y: 0 }}
              exit={{ opacity: 0, height: 0, y: -5 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="flex items-center space-x-1 text-xs text-red-500 font-semibold pl-1 overflow-hidden"
            >
              <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }
);
Select.displayName = "Select";
