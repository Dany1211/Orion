import * as React from "react";
import { Eye, EyeOff, Lock } from "lucide-react";
import { Input, type InputProps } from "./input";

export interface PasswordInputProps extends Omit<InputProps, "type"> {}

export const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ icon = <Lock className="h-4 w-4" />, ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false);

    const togglePasswordVisibility = (e: React.MouseEvent) => {
      e.preventDefault();
      setShowPassword((prev) => !prev);
    };

    return (
      <Input
        type={showPassword ? "text" : "password"}
        ref={ref}
        icon={icon}
        rightElement={
          <button
            type="button"
            onClick={togglePasswordVisibility}
            className="text-zinc-400 hover:text-zinc-600 transition-colors p-1.5 focus:outline-none focus:ring-1 focus:ring-primary/20 rounded-md"
            tabIndex={-1}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        }
        {...props}
      />
    );
  }
);
PasswordInput.displayName = "PasswordInput";
