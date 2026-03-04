import { PublicClientApplication } from "@azure/msal-browser";

const redirectUri =
  window.location.origin + import.meta.env.BASE_URL + "auth.html";

const msalConfig = {
  auth: {
    clientId: "de33a5a5-0b65-47b8-a09d-fbc5d152930d",
    authority:
      "https://login.microsoftonline.com/ae2211da-bf1e-486f-a627-2bc81566edf7",
    redirectUri,
    postLogoutRedirectUri: window.location.origin + import.meta.env.BASE_URL,
  },
  cache: {
    cacheLocation: "sessionStorage",
    storeAuthStateInCookie: false,
  },
};

export const oneDriveConfig = {
  // Set this to your Microsoft account email/UPN to force ALL uploads to your
  // OneDrive regardless of which user is signed in.  Leave empty ("") to use
  // the signed-in user's own OneDrive (original behaviour).
  //
  // When set, the logged-in user must have shared-write access to the target
  // folder on this account's OneDrive, and the MSAL scope is automatically
  // widened to Files.ReadWrite.All.
  ownerEmail: "massimo@ticktockloans.com",
};

export const loginRequest = {
  scopes: [
    "User.Read",
    oneDriveConfig.ownerEmail ? "Files.ReadWrite.All" : "Files.ReadWrite",
  ],
};

export const msalInstance = new PublicClientApplication(msalConfig);

// ✅ NEW: initialize once at startup
export const msalInit = msalInstance.initialize();
