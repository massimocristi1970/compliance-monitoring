import { PublicClientApplication } from "@azure/msal-browser";

/**
 * Configuration object to be passed to MSAL instance on creation.
 */
const msalConfig = {
  auth: {
    // Your Application (client) ID
    clientId: "de33a5a5-0b65-47b8-a09d-fbc5d152930d",

    // Your Directory (tenant) ID.
    authority:
      "https://login.microsoftonline.com/ae2211da-bf1e-486f-a627-2bc81566edf7",

    // Your Redirect URI
    redirectUri: "http://localhost:5173/compliance-monitoring/",
  },
  cache: {
    cacheLocation: "sessionStorage",
    storeAuthStateInCookie: false,
  },
};

/**
 * Scopes define the permissions your app needs.
 */
export const loginRequest = {
  scopes: ["User.Read", "Files.ReadWrite"],
};

// Create and export the MSAL instance
export const msalInstance = new PublicClientApplication(msalConfig);
