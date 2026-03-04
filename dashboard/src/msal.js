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
  // OneDrive.  When set, the app enforces that only this account can log in
  // via Microsoft — other users are prompted to sign in as this account.
  // This guarantees every upload lands in the owner's OneDrive using the
  // standard /me/drive/ endpoint (no admin consent required).
  // Leave empty ("") to allow any Microsoft account (uploads go to their own
  // OneDrive).
  ownerEmail: "massimo@ticktockloans.com",
};

export const loginRequest = {
  scopes: ["User.Read", "Files.ReadWrite"],
};

export const msalInstance = new PublicClientApplication(msalConfig);

// ✅ NEW: initialize once at startup
export const msalInit = msalInstance.initialize();
