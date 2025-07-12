"use client";
import { UpgradeContactDialog } from "../../../../components/ui/UpgradeContactDialog";

export default function UpgradeModal({ open, onCloseAction }: { open: boolean, onCloseAction: () => void }) {
  return (
    <UpgradeContactDialog 
      open={open} 
      onCloseAction={onCloseAction}
      feature="premium templates"
      title="Premium Template"
      description="The Modern template is available for premium users only. Contact our admin to upgrade and unlock all templates!"
    />
  );
}