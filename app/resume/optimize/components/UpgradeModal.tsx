"use client";
import { Lock } from "lucide-react";
import { Button } from "../../../../components/ui/Button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "../../../../components/ui/Dialog";

export default function UpgradeModal({ open, onClose }: { open: boolean, onClose: () => void }) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="text-yellow-500" /> Premium Feature
          </DialogTitle>
        </DialogHeader>
        <div className="py-2 text-gray-700">
          The Modern template is available for <span className="font-semibold text-blue-600">premium users</span> only.
          <br />
          Upgrade now to unlock all templates and advanced features!
        </div>
        <DialogFooter>
          <a href="/upgrade" className="w-full">
            <Button className="w-full">
              Upgrade Now
            </Button>
          </a>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}