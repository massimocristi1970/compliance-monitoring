import { PublicClientApplication } from "@azure/msal-browser";

/**
 * Configuration object to be passed to MSAL instance on creation.
 */
const msalConfig = {
  auth: {
    // Your Application (client) ID
    clientId: "de33a5a5-0b65-47b8-a09d-fbc5d152930d",

    // Your Directory (tenant) ID. This ensures only users from
    // your work organization can log in.
    authority:
      "https://login.microsoftonline.com/ae2211da-bf1e-486f-a627-2bc81566edf7",

    // Your Redirect URI from the previous step
    redirectUri: "http://localhost:5173/compliance-monitoring/",
  },
  cache: {
    cacheLocation: "sessionStorage", // This is more secure than localStorage
    storeAuthStateInCookie: false,
  },
};

/**
 * Scopes define the permissions your app needs.
 * For OneDrive, we need Files.ReadWrite.
 * (Make sure you added 'Files.ReadWrite' in the 'API permissions' tab in Entra)
 */
export const loginRequest = {
  scopes: ["User.Read", "Files.ReadWrite"],
};

// Create the MSAL instance
export const msalInstance = new PublicClientApplication(msalConfig);
