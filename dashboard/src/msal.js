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
  // Maps each authorised Microsoft account to the OneDrive folder path where
  // the compliance data folder lives *in that user's own drive*.
  // Each user logs in with their own account and uploads via /me/drive/,
  // so no admin consent or Files.ReadWrite.All scope is needed.
  //
  // To add a new team member: share the compliance folder with them in
  // OneDrive, ask them what path it appears at in their drive, and add
  // an entry here.
  authorisedUsers: {
    "massimo@ticktockloans.com":
      "Tick Tock Loans/Compliance/SLPL Compliance Monitoring/data",
    // TODO: Add your team member's email and their path to the shared folder
    // "colleague@ticktockloans.com":
    //   "Shared/Tick Tock Loans/Compliance/SLPL Compliance Monitoring/data",
  },
};

export const loginRequest = {
  scopes: ["User.Read", "Files.ReadWrite"],
};

export const msalInstance = new PublicClientApplication(msalConfig);

// ✅ NEW: initialize once at startup
export const msalInit = msalInstance.initialize();
