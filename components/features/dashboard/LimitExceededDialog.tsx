"use client";

import { AlertTriangle, Clock, Crown, RefreshCw, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "../../ui/base/Button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../ui/composite/Dialog";
import { UpgradeContactDialog } from "../../ui/UpgradeContactDialog";

interface LimitExceededDialogProps {
  open: boolean;
  onCloseAction: () => void;
  feature: string;
  remaining: number;
  resetTime: number;
  requiresUpgrade?: boolean;
  trialExpired?: boolean;
}

export function LimitExceededDialog({ 
  open, 
  onCloseAction, 
  feature, 
  remaining, 
  resetTime, 
  trialExpired = false 
}: LimitExceededDialogProps) {
  const [timeUntilReset, setTimeUntilReset] = useState<string>('');
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);

  // Calculate time until reset
  useEffect(() => {
    if (!resetTime) return;

    const updateTime = () => {
      const now = Date.now();
      const timeLeft = resetTime - now;
      
      if (timeLeft <= 0) {
        setTimeUntilReset('Available now');
        return;
      }
      
      const hours = Math.floor(timeLeft / (1000 * 60 * 60));
      const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
      
      if (hours > 0) {
        setTimeUntilReset(`${hours}h ${minutes}m`);
      } else {
        setTimeUntilReset(`${minutes}m`);
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, [resetTime]);

  const featureDisplayName = feature.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());

  if (trialExpired) {
    return (
      <UpgradeContactDialog 
        open={open} 
        onCloseAction={onCloseAction}
        feature="all premium features"
        title="Upgrade to Premium"
        description="Your free trial has expired. Contact our admin to upgrade and continue using all features!"
      />
    );
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onCloseAction}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-orange-600">
              <Zap className="h-5 w-5" />
              Daily Limit Reached
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-orange-100 p-2 rounded-full">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-orange-800">You&lsquo;ve reached your daily limit</h3>
                  <p className="text-sm text-orange-600">for {featureDisplayName}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-white rounded-lg p-3 border border-orange-200">
                  <div className="text-orange-600 font-medium">Remaining Today</div>
                  <div className="text-lg font-bold text-orange-800">{remaining}</div>
                </div>
                <div className="bg-white rounded-lg p-3 border border-orange-200">
                  <div className="text-orange-600 font-medium">Resets In</div>
                  <div className="text-lg font-bold text-orange-800">{timeUntilReset}</div>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">Your Options:</h4>
              <div className="space-y-2 text-sm text-blue-800">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <span>Wait until midnight for reset</span>
                </div>
                <div className="flex items-center gap-2">
                  <Crown className="h-4 w-4 text-yellow-500" />
                  <span>Upgrade to Premium for unlimited access</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={onCloseAction} 
                variant="outline" 
                className="flex-1"
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Try Later
              </Button>
              <Button 
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                onClick={() => setShowUpgradeDialog(true)}
              >
                <Crown className="h-4 w-4 mr-1" />
                Upgrade Now
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      <UpgradeContactDialog 
        open={showUpgradeDialog} 
        onCloseAction={() => setShowUpgradeDialog(false)}
        feature={featureDisplayName}
        title="Upgrade to Premium"
        description={`You've reached your daily limit for ${featureDisplayName}. Upgrade to premium for unlimited access!`}
      />
    </>
  );
} 