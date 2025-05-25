import { ResumeTemplate } from "../hooks/usePdfGenerator";

/**
 * Check if a template is allowed for the user's subscription type
 * @param template The template to check
 * @param isPremium Whether the user has a premium subscription
 * @returns boolean indicating if the template is allowed
 */
export function isTemplateAllowed(template: ResumeTemplate, isPremium: boolean): boolean {
  if (template === 'modern' && !isPremium) {
    return false;
  }
  return true;
}
