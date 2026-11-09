import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/VoteChain-A_Blockchain_Based_E-Voting_System/",
  plugins: [react()],
  server: { port: 5173 },
});
