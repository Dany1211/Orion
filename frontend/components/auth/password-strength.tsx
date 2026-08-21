import * as React from "react";
import { Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface PasswordStrengthProps {
  value: string;
  showRequirements?: boolean;
}

export function PasswordStrength({ value = "", showRequirements = false }: PasswordStrengthProps) {
  const requirements = [
    { id: "length", label: "8+ chars", test: (val: string) => val.length >= 8 },
    { id: "upper", label: "Uppercase", test: (val: string) => /[A-Z]/.test(val) },
    { id: "lower", label: "Lowercase", test: (val: string) => /[a-z]/.test(val) },
    { id: "number", label: "Number", test: (val: string) => /[0-9]/.test(val) },
    { id: "special", label: "Special symbol", test: (val: string) => /[^A-Za-z0-9]/.test(val) },
  ];

  const metCount = requirements.filter((req) => req.test(value)).length;

  let strengthLabel = "Weak";
  let strengthColor = "bg-red-500";
  let strengthText = "text-red-500";
  let barWidth = "w-1/5";

  if (value.length > 0) {
    if (metCount >= 5) {
      strengthLabel = "Strong";
      strengthColor = "bg-emerald-500";
      strengthText = "text-emerald-500";
      barWidth = "w-full";
    } else if (metCount >= 3) {
      strengthLabel = "Medium";
      strengthColor = "bg-amber-500";
      strengthText = "text-amber-500";
      barWidth = "w-3/5";
    } else {
      strengthLabel = "Weak";
      strengthColor = "bg-red-500";
      strengthText = "text-red-500";
      barWidth = "w-1/5";
    }
  } else {
    strengthLabel = "";
    strengthColor = "bg-zinc-200";
    barWidth = "w-0";
  }

  return (
    <div className="space-y-2 select-none">
      {/* Strength Bar */}
      <AnimatePresence initial={false}>
        {value.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-1 overflow-hidden"
          >
            <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider">
              <span className="text-zinc-400">Password Strength</span>
              <span className={cn("transition-colors duration-300 font-extrabold", strengthText)}>
                {strengthLabel}
              </span>
            </div>
            <div className="h-1 w-full bg-zinc-100 rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full transition-all duration-500 ease-out",
                  strengthColor,
                  barWidth
                )}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Requirement Checklist */}
      <AnimatePresence initial={false}>
        {showRequirements && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="bg-zinc-50 border border-zinc-150/60 rounded-xl p-3 mt-1.5 space-y-2">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400">
                Password Requirements
              </p>
              <div className="flex flex-wrap gap-x-3 gap-y-1.5">
                {requirements.map((req) => {
                  const isMet = req.test(value);
                  return (
                    <div
                      key={req.id}
                      className={cn(
                        "flex items-center space-x-1 text-[11px] font-semibold transition-colors duration-255",
                        isMet
                          ? "text-emerald-600"
                          : "text-zinc-400"
                      )}
                    >
                      <div
                        className={cn(
                          "h-3.5 w-3.5 rounded-full flex items-center justify-center transition-colors",
                          isMet ? "bg-emerald-50 border border-emerald-150" : "bg-zinc-100 border border-zinc-200"
                        )}
                      >
                        <Check
                          className={cn(
                            "h-2 w-2 text-emerald-600 stroke-[3.5] transition-transform",
                            isMet ? "scale-100" : "scale-0"
                          )}
                        />
                      </div>
                      <span>{req.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
