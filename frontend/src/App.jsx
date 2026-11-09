import React, { useCallback, useEffect, useState } from "react";
import { connectWallet, hasMetaMask, readableError, shorten, deployment } from "./blockchain.js";
import { partyOf } from "./candidates.js";

export default function App() {
  const [page, setPage] = useState("vote"); // "vote" | "admin"
  const [wallet, setWallet] = useState(null); // { account, contract }
  const [candidates, setCandidates] = useState([]); // [{ index, name, votes }]
  const [voted, setVoted] = useState(false);
  const [busyIndex, setBusyIndex] = useState(null);
  const [status, setStatus] = useState({ type: "info", text: "Connect your wallet to begin." });

  const refresh = useCallback(async (contract, account) => {
    const [names, counts] = await contract.getResults();
    setCandidates(names.map((name, i) => ({ index: i, name, votes: Number(counts[i]) })));
    setVoted(await contract.hasVoted(account));
  }, []);

  const connect = async () => {
    try {
      setStatus({ type: "info", text: "Connecting wallet…" });
      const w = await connectWallet((text) => setStatus({ type: "info", text }));
      setWallet(w);
      await refresh(w.contract, w.account);
      setStatus({ type: "ok", text: "Wallet connected successfully." });
    } catch (err) {
      setStatus({ type: "error", text: readableError(err) });
    }
  };

  // Live updates: refresh on new votes and when the account/network changes.
  useEffect(() => {
    if (!wallet) return;
    const { contract, account } = wallet;
    const onVote = () => refresh(contract, account).catch(() => {});
    contract.on("VoteCast", onVote);
    return () => {
      contract.off("VoteCast", onVote);
    };
  }, [wallet, refresh]);

  useEffect(() => {
    if (!hasMetaMask()) return;
    const reload = () => window.location.reload();
    window.ethereum.on?.("accountsChanged", reload);
    window.ethereum.on?.("chainChanged", reload);
    return () => {
      window.ethereum.removeListener?.("accountsChanged", reload);
      window.ethereum.removeListener?.("chainChanged", reload);
    };
  }, []);

  const castVote = async (index) => {
    try {
      setBusyIndex(index);
      setStatus({ type: "info", text: "Waiting for MetaMask approval…" });
      const tx = await wallet.contract.vote(index);
      setStatus({ type: "info", text: "Transaction submitted. Waiting for confirmation…" });
      await tx.wait();
      await refresh(wallet.contract, wallet.account);
      setStatus({ type: "ok", text: "Your vote has been recorded on the blockchain!" });
    } catch (err) {
      setStatus({ type: "error", text: readableError(err) });
    } finally {
      setBusyIndex(null);
    }
  };

  const total = candidates.reduce((s, c) => s + c.votes, 0);

  return (
    <div className="shell">
      <header className="topbar">
        <div className="brand">
          <span className="logo">⛓</span> VoteChain
        </div>
        <div className="actions">
          <button className="btn" onClick={() => setPage(page === "vote" ? "admin" : "vote")}>
            {page === "vote" ? "Admin Panel" : "Back to Voting"}
          </button>
          <button className="btn" onClick={connect} disabled={!!wallet}>
            {wallet ? shorten(wallet.account) : "Connect Wallet"}
          </button>
        </div>
      </header>

      {page === "vote" ? (
        <>
          <section className="hero">
            <p className="eyebrow">BLOCKCHAIN-BASED E-VOTING</p>
            <h1>
              Your Vote.
              <br />
              Your Voice.
            </h1>
            <p className="sub">Connect your wallet and cast a vote on the local blockchain.</p>
          </section>

          <section className="panel">
            <div className="panel-head">
              <div>
                <p className="eyebrow">CAST YOUR VOTE</p>
                <h2>Choose your candidate</h2>
              </div>
              <span className="pill">{candidates.length} candidates</span>
            </div>

            {!wallet ? (
              <p className="muted center">Connect MetaMask to view the candidates.</p>
            ) : (
              <div className="grid">
                {candidates.map((c) => (
                  <article key={c.index} className="card">
                    <div className={`badge b${c.index % 3}`}>{String.fromCharCode(65 + c.index)}</div>
                    <h3>{c.name}</h3>
                    <p className="muted">{partyOf(c.name)}</p>
                    <div className="card-foot">
                      <span className="muted">Votes: {c.votes}</span>
                      <button
                        className="btn primary"
                        disabled={voted || busyIndex !== null}
                        onClick={() => castVote(c.index)}
                      >
                        {busyIndex === c.index ? "Voting…" : voted ? "Voted" : "Vote now →"}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </>
      ) : (
        <AdminDashboard wallet={wallet} candidates={candidates} total={total} onConnect={connect} />
      )}

      <div className={`status ${status.type}`}>{status.text}</div>
      {!hasMetaMask() && (
        <p className="muted center">
          This browser has no wallet extension available.{" "}
          <a href="https://metamask.io/download/" target="_blank" rel="noreferrer">
            Install MetaMask
          </a>
          , then open this page in that browser and reload.
        </p>
      )}
      <footer className="foot">
        Demo application running on a local Hardhat blockchain · Contract {shorten(deployment.address)}
      </footer>
    </div>
  );
}

function AdminDashboard({ wallet, candidates, total, onConnect }) {
  return (
    <>
      <section className="hero">
        <p className="eyebrow">ADMIN DASHBOARD</p>
        <h1>Election Overview</h1>
        <p className="sub">Monitor candidate results and votes recorded on-chain.</p>
      </section>

      <section className="stats">
        <div className="stat">
          <p className="eyebrow">TOTAL VOTES</p>
          <p className="big">{wallet ? total : "—"}</p>
          <p className="muted">Votes recorded on the blockchain</p>
        </div>
        <div className="stat">
          <p className="eyebrow">CANDIDATES</p>
          <p className="big">{wallet ? candidates.length : "—"}</p>
          <p className="muted">Candidates in this election</p>
        </div>
        <div className="stat">
          <p className="eyebrow">WALLET STATUS</p>
          <p className="big small">{wallet ? "Connected" : "Not connected"}</p>
          <p className="muted">{wallet ? shorten(wallet.account) : "—"}</p>
        </div>
      </section>

      <section className="panel">
        <h2 className="center">Candidate Results</h2>
        <p className="muted center">Live counts read from the Voting smart contract.</p>
        {!wallet ? (
          <p className="center">
            <button className="btn primary" onClick={onConnect}>
              Connect Wallet
            </button>
          </p>
        ) : (
          candidates.map((c) => {
            const pct = total ? (c.votes / total) * 100 : 0;
            return (
              <div key={c.index} className="result">
                <div className="result-row">
                  <span>
                    {c.name} — {partyOf(c.name)}
                  </span>
                  <span>
                    {c.votes} ({pct.toFixed(1)}%)
                  </span>
                </div>
                <div className="bar">
                  <div className="fill" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })
        )}
        <p className="muted center note">
          Student demo: this panel displays on-chain results. It does not implement secure administrator
          authentication.
        </p>
      </section>
    </>
  );
}
