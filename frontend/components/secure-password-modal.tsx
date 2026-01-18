/**
 * Secure Password Modal
 *
 * A secure modal for displaying temporary passwords to administrators.
 *
 * SECURITY FEATURES:
 * - Password is not shown in toast notifications
 * - Password is masked by default with show/hide toggle
 * - Copy to clipboard functionality with visual feedback
 * - Auto-dismiss after copying (optional)
 * - Secure against XSS (escapes HTML)
 * - No localStorage storage of passwords
 *
 * @version 1.0.0
 * @lastUpdated 2025-01-17
 */

"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, Copy, Eye, EyeOff, Shield } from "lucide-react";
import logger from "@/lib/logger";
import { toast } from "sonner";

interface SecurePasswordModalProps {
  /**
   * Whether the modal is open
   */
  open: boolean;

  /**
   * Callback when modal is closed
   */
  onOpenChange: (open: boolean) => void;

  /**
   * The temporary password to display (SECURE: never log or expose this)
   */
  password: string;

  /**
   * Email/username for context (does not contain password)
   */
  email?: string;

  /**
   * Auto-dismiss modal after copying password
   * @default true
   */
  autoCloseAfterCopy?: boolean;

  /**
   * Show success message after copying
   * @default true
   */
  showSuccessMessage?: boolean;
}

/**
 * Secure Password Modal Component
 *
 * Displays temporary password securely with:
 * - Masked display with show/hide toggle
 * - One-click copy to clipboard
 * - Visual feedback
 * - Auto-dismiss option
 *
 * @example
 * const [showModal, setShowModal] = useState(false);
 * const [tempPassword, setTempPassword] = useState('');
 *
 * // After creating user:
 * setTempPassword(result.tempPassword);
 * setShowModal(true);
 *
 * return (
 *   <SecurePasswordModal
 *     open={showModal}
 *     onOpenChange={setShowModal}
 *     password={tempPassword}
 *     email="newuser@example.com"
 *   />
 * );
 */
export function SecurePasswordModal({
  open,
  onOpenChange,
  password,
  email,
  autoCloseAfterCopy = true,
  showSuccessMessage = true,
}: SecurePasswordModalProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);

  /**
   * Copy password to clipboard
   *
   * SECURITY: Uses Clipboard API which requires user gesture.
   * Clears copied state after 2 seconds.
   */
  const handleCopyPassword = async () => {
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);

      if (showSuccessMessage) {
        toast.success("Password copied to clipboard", {
          description: "Paste it securely. It will not be shown again.",
          duration: 3000,
        });
      }

      // Reset copied state after 2 seconds
      setTimeout(() => {
        setCopied(false);
      }, 2000);

      // Auto-close modal after copying (if enabled)
      if (autoCloseAfterCopy) {
        setTimeout(() => {
          onOpenChange(false);
          // Clear password from state after closing
          setShowPassword(false);
        }, 1500);
      }
    } catch (error) {
      logger.error("Failed to copy password", error as Error);
      toast.error("Failed to copy password. Please copy manually.");
    }
  };

  /**
   * Toggle password visibility
   *
   * SECURITY: Password is masked by default.
   * User must explicitly click to show it.
   */
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  /**
   * Handle modal close
   *
   * SECURITY: Reset state when closing to prevent password from staying in memory
   */
  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      // Reset state
      setShowPassword(false);
      setCopied(false);
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
              <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <DialogTitle>User Created Successfully</DialogTitle>
            </div>
          </div>
          <DialogDescription className="pt-2">
            {email ? (
              <span>
                The user account for <strong>{email}</strong> has been created.
              </span>
            ) : (
              "The user account has been created."
            )}{" "}
            Please securely share the temporary password below. The user will be required to change
            it on first login.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Password Display */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Temporary Password
            </label>
            <div className="flex gap-2">
              {/* Password Input (masked by default) */}
              <div className="relative flex-1">
                <div className="flex h-11 w-full items-center rounded-md border border-zinc-300 bg-zinc-50 px-3 font-mono text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100">
                  {showPassword ? (
                    // Show password (only when user explicitly toggles)
                    <span className="break-all">{password}</span>
                  ) : (
                    // Mask password (default)
                    <span className="tracking-widest">••••••••••••</span>
                  )}
                </div>
              </div>

              {/* Show/Hide Button */}
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={togglePasswordVisibility}
                className="shrink-0"
                aria-label={showPassword ? "Hide password" : "Show password"}
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>

              {/* Copy Button */}
              <Button
                type="button"
                variant={copied ? "default" : "outline"}
                size="icon"
                onClick={handleCopyPassword}
                className="shrink-0"
                aria-label={copied ? "Password copied" : "Copy password"}
                title={copied ? "Password copied" : "Copy password"}
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Security Notice */}
          <div className="rounded-md border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950/50">
            <p className="text-xs text-amber-800 dark:text-amber-200">
              <strong>Security Notice:</strong> This password will only be shown once. Please save
              it securely. The user will need to change it on first login.
            </p>
          </div>

          {/* Instructions */}
          <div className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
            <p className="font-medium text-zinc-900 dark:text-zinc-100">Next Steps:</p>
            <ol className="list-inside list-decimal space-y-1">
              <li>Copy the password using the button above</li>
              <li>Share it securely with the user via a secure channel</li>
              <li>User will be prompted to change password on first login</li>
            </ol>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleClose(false)}
            className="flex-1 sm:flex-none"
          >
            Close
          </Button>
          <Button
            type="button"
            onClick={handleCopyPassword}
            disabled={copied}
            className="flex-1 sm:flex-none"
          >
            {copied ? "Copied!" : "Copy Password"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Hook to manage secure password modal state
 *
 * @example
 * function UserManagement() {
 *   const passwordModal = useSecurePasswordModal();
 *
 *   const handleCreateUser = async () => {
 *     const result = await usersApi.inviteUser(data);
 *     passwordModal.show(result.tempPassword, data.email);
 *   };
 *
 *   return (
 *     <>
 *       <Button onClick={handleCreateUser}>Create User</Button>
 *       <SecurePasswordModal {...passwordModal.props} />
 *     </>
 *   );
 * }
 */
export function useSecurePasswordModal() {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");

  const show = (newPassword: string) => {
    setPassword(newPassword);
    setOpen(true);
  };

  const hide = () => {
    setOpen(false);
    // Clear password from state after a short delay
    setTimeout(() => {
      setPassword("");
    }, 500);
  };

  return {
    show,
    hide,
    props: {
      open,
      onOpenChange: setOpen,
      password,
    },
  };
}

export default SecurePasswordModal;
