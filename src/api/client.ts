import axios from "axios";
import { auth } from "../services/firebase";

const client = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
});

export default client;

// This runs silently BEFORE every request
client.interceptors.request.use(
  async (config) => {
    const user = auth.currentUser;

    if (user) {
      const token = await user.getIdToken(true);
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);
