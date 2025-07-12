"use client";

import { Crown, Mail, MessageCircle } from "lucide-react";
import { Button } from "./base/Button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./composite/Dialog";

interface UpgradeContactDialogProps {
  open: boolean;
  onClose: () => void;
  feature?: string;
  title?: string;
  description?: string;
}

export function UpgradeContactDialog({ 
  open, 
  onClose, 
  feature = "premium features",
  title = "Ready to Upgrade?",
  description = "Contact our admin to get premium access and unlock all features!"
}: UpgradeContactDialogProps) {
  
  const adminEmail = "olawale@ola-hub.dev";
  const adminWhatsApp = "+447511901133";
  const whatsappMessage = `Hi! I'm interested in upgrading to premium to access ${feature}. Can you help me with the upgrade process?`;

  const handleEmailContact = () => {
    const subject = `Premium Upgrade Request - ${feature}`;
    const body = `Hello,

I would like to upgrade to premium to access ${feature}. 

Please let me know:
- Available pricing plans
- Payment methods
- How to proceed with the upgrade

Thank you!`;

    window.location.href = `mailto:${adminEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const handleWhatsAppContact = () => {
    const whatsappUrl = `https://wa.me/${adminWhatsApp.replace(/[^\d]/g, '')}?text=${encodeURIComponent(whatsappMessage)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-blue-600">
            <Crown className="h-5 w-5" />
            {title}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-gray-600 text-sm">
            {description}
          </p>
          
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Premium Benefits:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Unlimited resume optimizations</li>
              <li>• All premium templates</li>
              <li>• Priority support</li>
              <li>• Advanced AI features</li>
              <li>• No daily limits</li>
            </ul>
          </div>
          
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">Contact Admin:</h4>
            
            <Button
              onClick={handleEmailContact}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2"
            >
              <Mail className="h-4 w-4" />
              Email: {adminEmail}
            </Button>
            
            <Button
              onClick={handleWhatsAppContact}
              className="w-full bg-green-600 hover:bg-green-700 text-white flex items-center justify-center gap-2"
            >
              <MessageCircle className="h-4 w-4" />
              WhatsApp Chat
            </Button>
          </div>
          
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-xs text-gray-600">
              <strong>Response time:</strong> We typically respond within 2-4 hours during business hours.
            </p>
          </div>
          
          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={onClose}
              className="w-full"
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 