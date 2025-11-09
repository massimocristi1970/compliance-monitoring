import { PublicClientApplication } from "@azure/msal-browser";

const msalConfig = {
  auth: {
    clientId: "de33a5a5-0b65-47b8-a09d-fbc5d152930d",
    authority: "https://login.microsoftonline.com/ae2211da-bf1e-486f-a627-2bc81566edf7",
    
    // This MUST point to the new auth.html file
    redirectUri: "http://localhost:5173/compliance-monitoring/auth.html",
  },
  cache: {
    cacheLocation: "sessionStorage", 
    storeAuthStateInCookie: false,
  },
};

export const loginRequest = {
  scopes: ["User.Read", "Files.ReadWrite"],
};

// Create and export the MSAL instance
export const msalInstance = new PublicClientApplication(msalConfig);
