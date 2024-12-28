// src/utils/registration-analytics.ts

// Define the analytics events
const ANALYTICS_EVENTS = {
  REGISTRATION_STARTED: "registration_started",
  REGISTRATION_STEP_CHANGED: "registration_step_changed",
  REGISTRATION_COMPLETED: "registration_completed",
  REGISTRATION_FAILED: "registration_failed",
};

// Function to log analytics events
const logEvent = (event: string, data?: Record<string, any>) => {
  // Implement your analytics logging logic here
  // This could involve sending data to an analytics service or logging to the console
  console.log(`[Analytics] ${event}`, data);
};

// Function to track registration started event
const trackRegistrationStarted = () => {
  logEvent(ANALYTICS_EVENTS.REGISTRATION_STARTED);
};

// Function to track registration step changed event
const trackRegistrationStepChanged = (step: number) => {
  logEvent(ANALYTICS_EVENTS.REGISTRATION_STEP_CHANGED, { step });
};

// Function to track registration completed event
const trackRegistrationCompleted = (registrationData: Record<string, any>) => {
  logEvent(ANALYTICS_EVENTS.REGISTRATION_COMPLETED, registrationData);
};

// Function to track registration failed event
const trackRegistrationFailed = (error: string) => {
  logEvent(ANALYTICS_EVENTS.REGISTRATION_FAILED, { error });
};

export const registrationAnalytics = {
  trackRegistrationStarted,
  trackRegistrationStepChanged,
  trackRegistrationCompleted,
  trackRegistrationFailed,
};
