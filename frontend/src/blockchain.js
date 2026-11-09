import { BrowserProvider, Contract } from "ethers";
import deployment from "./contract.json";

const CHAIN_ID_HEX = "0x" + Number(deployment.chainId || 31337).toString(16);

export function hasMetaMask() {
  return typeof window !== "undefined" && !!window.ethereum;
}

// Make sure MetaMask is on the local Hardhat network (chain 31337).
export async function ensureLocalNetwork(onStatus) {
  try {
    onStatus?.("Approve switching to the Hardhat Local network in MetaMask.");
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: CHAIN_ID_HEX }],
    });
  } catch (err) {
    if (err?.code === 4902 || err?.data?.originalError?.code === 4902) {
      onStatus?.("Approve adding the Hardhat Local network in MetaMask.");
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: CHAIN_ID_HEX,
            chainName: "Hardhat Local",
            rpcUrls: ["http://127.0.0.1:8545"],
            nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
          },
        ],
      });
    } else {
      throw err;
    }
  }
}

export async function connectWallet(onStatus) {
  if (!hasMetaMask())
    throw new Error("No browser wallet detected. Install or enable MetaMask in this browser, then reload VoteChain.");
  onStatus?.("Approve the connection request in MetaMask. If no popup appears, open the MetaMask extension and check for a pending request.");
  await window.ethereum.request({ method: "eth_requestAccounts" });
  await ensureLocalNetwork(onStatus);
  const provider = new BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  const account = await signer.getAddress();
  const contract = new Contract(deployment.address, deployment.abi, signer);
  return { provider, signer, account, contract };
}

export const shorten = (a) => (a ? `${a.slice(0, 6)}…${a.slice(-4)}` : "");

// Turn contract/MetaMask errors into readable messages.
export function readableError(err) {
  const msg = err?.reason || err?.shortMessage || err?.info?.error?.message || err?.message || "";
  if (err?.code === "ACTION_REJECTED" || err?.code === 4001) return "Transaction rejected in MetaMask.";
  if (msg.includes("Already voted")) return "This wallet has already voted.";
  if (msg.includes("Invalid candidate")) return "Invalid candidate selected.";
  if (msg.includes("could not decode") || msg.includes("BAD_DATA"))
    return "Contract not found. Is the Hardhat node running and the contract deployed?";
  return msg || "Something went wrong.";
}

export { deployment };
