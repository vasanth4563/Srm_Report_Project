export const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:8000/";

export const Url = {
  login: baseUrl + "api/auth/login",
  profile: baseUrl + "api/auth/me",
  register: baseUrl + "api/auth/register",
  users: baseUrl + "api/auth/users",
};
