import axios from "axios";

const headers = {
  "Content-Type": "application/json",
};
const baseURL = "https://riddles-api-eight.vercel.app";

const createapi = (url = baseURL) =>
  axios.create({
    baseURL: url,
    headers,
  });

export default createapi;
