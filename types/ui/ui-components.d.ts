// UI Component declarations
declare module "./base/Button" {
  export const Button: React.FC<any>;
}

declare module "./base/Card" {
  export const Card: React.FC<any>;
  export const CardContent: React.FC<any>;
  export const CardHeader: React.FC<any>;
  export const CardTitle: React.FC<any>;
}

declare module "./base/Input" {
  export const Input: React.FC<any>;
}

declare module "./base/Switch" {
  export const Switch: React.FC<any>;
}

declare module "./composite/Tabs" {
  export const Tabs: React.FC<any>;
  export const TabsContent: React.FC<any>;
  export const TabsList: React.FC<any>;
  export const TabsTrigger: React.FC<any>;
}

declare module "./base/Textarea" {
  export const Textarea: React.FC<any>;
} 