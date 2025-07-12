"use client";
import { UpgradeContactDialog } from "../../../../components/ui/UpgradeContactDialog";

export default function UpgradeModal({ open, onClose }: { open: boolean, onClose: () => void }) {
  return (
    <UpgradeContactDialog 
      open={open} 
      onClose={onClose}
      feature="premium templates"
      title="Premium Template"
      description="The Modern template is available for premium users only. Contact our admin to upgrade and unlock all templates!"
    />
  );
}