import { PublicClientApplication } from "@azure/msal-browser";

const redirectUri =
  window.location.origin + import.meta.env.BASE_URL + "auth.html";

const msalConfig = {
  auth: {
    clientId: "de33a5a5-0b65-47b8-a09d-fbc5d152930d",
    authority:
      "https://login.microsoftonline.com/ae2211da-bf1e-486f-a627-2bc81566edf7",
    redirectUri, // dev: http://localhost:5173/auth.html
    // prod (GitHub Pages): https://massimocristi1970.github.io/compliance-monitoring/auth.html
    postLogoutRedirectUri: window.location.origin + import.meta.env.BASE_URL,
  },
  cache: {
    cacheLocation: "sessionStorage",
    storeAuthStateInCookie: false,
  },
};

export const loginRequest = {
  scopes: ["User.Read", "Files.ReadWrite"],
};

export const msalInstance = new PublicClientApplication(msalConfig);
