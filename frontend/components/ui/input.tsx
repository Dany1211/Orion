import * as React from "react";
import { AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  icon?: React.ReactNode;
  rightElement?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", label, error, icon, rightElement, ...props }, ref) => {
    return (
      <div className="w-full flex flex-col space-y-1.5">
        {/* Input Label above input */}
        <label className="text-xs font-bold text-zinc-700 select-none">
          {label}
        </label>
        
        <div className="relative">
          {/* Inner Left Icon */}
          {icon && (
            <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-zinc-400">
              {icon}
            </div>
          )}

          <input
            type={type}
            ref={ref}
            className={cn(
              "block w-full h-12 text-sm text-zinc-800 bg-white border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 placeholder:text-zinc-400 font-medium",
              icon ? "pl-11" : "px-4",
              rightElement ? "pr-12" : "pr-4",
              error && "border-red-500 focus:ring-red-500/20 focus:border-red-500",
              className
            )}
            {...props}
          />

          {/* Right side element (like show/hide password toggle) */}
          {rightElement && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              {rightElement}
            </div>
          )}
        </div>

        {/* Height revealing validation using Framer Motion */}
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
Input.displayName = "Input";
