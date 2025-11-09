import { PublicClientApplication } from "@azure/msal-browser";

// --- PASTE YOUR CLIENT ID HERE ---
// You get this from the Azure Portal
const MSAL_CLIENT_ID = "YOUR_AZURE_APP_CLIENT_ID_GOES_HERE";

/**
 * Configuration object to be passed to MSAL instance on creation.
 * For a full list of MSAL.js configuration parameters, visit:
 * https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/configuration.md
 */
const msalConfig = {
  auth: {
    clientId: MSAL_CLIENT_ID,
    // This is for your WORK account.
    // Replace 'common' with your Tenant ID if you have it.
    authority: "https://login.microsoftonline.com/common",
    // This is the page that Azure will redirect back to after login.
    redirectUri: "http://localhost:3000", // Or your production URL
  },
  cache: {
    cacheLocation: "sessionStorage", // This is more secure than localStorage
    storeAuthStateInCookie: false,
  },
};

/**
 * Scopes define the permissions your app needs.
 * For OneDrive, we need Files.ReadWrite.
 */
export const loginRequest = {
  scopes: ["User.Read", "Files.ReadWrite"],
};

// Create the MSAL instance
export const msalInstance = new PublicClientApplication(msalConfig);
